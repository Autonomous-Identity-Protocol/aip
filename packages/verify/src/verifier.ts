import * as jose from "jose";
import {
  AIP_ALGORITHM,
  AIP_CLAIMS,
  JWKS_CACHE_TTL_MS,
  DEFAULT_ASSURANCE,
  aipTokenClaimsSchema,
  AipTokenExpiredError,
  AipTokenInvalidError,
  AipSignatureError,
  AipAudienceMismatchError,
  AipIssuerMismatchError,
  AipJwksFetchError,
  AipEntityRevokedError,
  AipEntitySuspendedError,
  type AipIdentity,
  type AipEntityStatus,
} from "@aip/core";

/**
 * Configuration for creating an AIP token verifier.
 */
export interface AipVerifierConfig {
  /** AIA issuer URL (e.g., "https://registeragent.id") */
  issuerUrl: string;
  /** JWKS cache TTL in milliseconds (default: 1 hour) */
  jwksCacheTtlMs?: number;
  /** Whether to check entity status on verification (default: false) */
  checkStatus?: boolean;
  /** Status cache TTL in milliseconds (default: 60 seconds) */
  statusCacheTtlMs?: number;
  /** Custom fetch implementation for environments without global fetch */
  fetch?: typeof globalThis.fetch;
}

/**
 * An AIP token verifier instance.
 */
export interface AipVerifier {
  /**
   * Verify an AIP ID Token and extract the identity.
   *
   * @param token - The JWT token string
   * @param options - Verification options
   * @returns Verified identity object
   * @throws AipTokenExpiredError, AipTokenInvalidError, AipSignatureError, etc.
   *
   * @example
   * ```typescript
   * const verifier = createAipVerifier({ issuerUrl: "https://registeragent.id" });
   * const identity = await verifier.verify(token, { audience: "https://myapp.com" });
   * console.log(identity.entityId, identity.ownerEmail);
   * ```
   */
  verify: (
    token: string,
    options: { audience: string }
  ) => Promise<AipIdentity>;
}

/**
 * Create an AIP token verifier that validates AIA-issued ID tokens.
 * Handles JWKS fetching, caching, signature verification, and claim validation.
 *
 * @param config - Verifier configuration
 * @returns Verifier instance with a `verify` method
 *
 * @example
 * ```typescript
 * const verifier = createAipVerifier({
 *   issuerUrl: "https://registeragent.id",
 * });
 *
 * // In your request handler:
 * const identity = await verifier.verify(token, {
 *   audience: "https://myapp.com",
 * });
 * ```
 */
export function createAipVerifier(config: AipVerifierConfig): AipVerifier {
  const {
    issuerUrl,
    jwksCacheTtlMs = JWKS_CACHE_TTL_MS,
    checkStatus = false,
    statusCacheTtlMs = 60_000,
  } = config;

  const fetchImpl = config.fetch ?? globalThis.fetch;

  const jwksUrl = new URL("/.well-known/jwks.json", issuerUrl).toString();

  let cachedJwks: jose.JSONWebKeySet | null = null;
  let jwksCachedAt = 0;

  const statusCache = new Map<
    string,
    { status: AipEntityStatus; cachedAt: number }
  >();

  async function fetchJwks(): Promise<jose.JSONWebKeySet> {
    const now = Date.now();
    if (cachedJwks && now - jwksCachedAt < jwksCacheTtlMs) {
      return cachedJwks;
    }

    let response: Response;
    try {
      response = await fetchImpl(jwksUrl);
    } catch (error) {
      if (cachedJwks) return cachedJwks;
      throw new AipJwksFetchError(
        issuerUrl,
        error instanceof Error ? error : undefined
      );
    }

    if (!response.ok) {
      if (cachedJwks) return cachedJwks;
      throw new AipJwksFetchError(issuerUrl);
    }

    const jwks = (await response.json()) as jose.JSONWebKeySet;
    cachedJwks = jwks;
    jwksCachedAt = now;
    return jwks;
  }

  async function getKeyFromJwks(
    kid: string
  ): Promise<jose.CryptoKey | jose.KeyObject> {
    const jwks = await fetchJwks();

    const matchingKey = jwks.keys.find((k) => k.kid === kid);
    if (!matchingKey) {
      // Force refetch in case keys were rotated
      cachedJwks = null;
      const refreshedJwks = await fetchJwks();
      const retryKey = refreshedJwks.keys.find((k) => k.kid === kid);
      if (!retryKey) {
        throw new AipSignatureError(
          `No key found with kid "${kid}" in the issuer JWKS. The issuer may have rotated keys.`
        );
      }
      const imported = await jose.importJWK(retryKey, AIP_ALGORITHM);
      if (imported instanceof Uint8Array) {
        throw new AipSignatureError("JWKS key is not an asymmetric key.");
      }
      return imported;
    }

    const imported = await jose.importJWK(matchingKey, AIP_ALGORITHM);
    if (imported instanceof Uint8Array) {
      throw new AipSignatureError("JWKS key is not an asymmetric key.");
    }
    return imported;
  }

  async function checkEntityStatus(entityId: string): Promise<void> {
    const now = Date.now();
    const cached = statusCache.get(entityId);
    if (cached && now - cached.cachedAt < statusCacheTtlMs) {
      if (cached.status.status === "revoked") {
        throw new AipEntityRevokedError(entityId);
      }
      if (cached.status.status === "suspended") {
        throw new AipEntitySuspendedError(entityId);
      }
      return;
    }

    const statusUrl = new URL(
      `/api/status?sub=${encodeURIComponent(entityId)}`,
      issuerUrl
    ).toString();

    try {
      const response = await fetchImpl(statusUrl);
      if (!response.ok) return;

      const body = (await response.json()) as { data: AipEntityStatus };
      const entityStatus = body.data;

      statusCache.set(entityId, { status: entityStatus, cachedAt: now });

      if (entityStatus.status === "revoked") {
        throw new AipEntityRevokedError(entityId);
      }
      if (entityStatus.status === "suspended") {
        throw new AipEntitySuspendedError(entityId);
      }
    } catch (error) {
      if (
        error instanceof AipEntityRevokedError ||
        error instanceof AipEntitySuspendedError
      ) {
        throw error;
      }
      // Status check failure is non-fatal — degrade gracefully
    }
  }

  async function verify(
    token: string,
    options: { audience: string }
  ): Promise<AipIdentity> {
    let header: jose.ProtectedHeaderParameters;
    try {
      header = jose.decodeProtectedHeader(token);
    } catch {
      throw new AipTokenInvalidError("Token header cannot be decoded.");
    }

    if (header.alg !== AIP_ALGORITHM) {
      throw new AipTokenInvalidError(
        `Token uses algorithm "${header.alg}" but only "${AIP_ALGORITHM}" is supported.`
      );
    }

    const kid = header.kid;
    if (!kid) {
      throw new AipTokenInvalidError(
        'Token header is missing "kid" (key ID). Ensure the token was issued by AIA.'
      );
    }

    const publicKey = await getKeyFromJwks(kid);

    let payload: jose.JWTPayload;
    try {
      const result = await jose.jwtVerify(token, publicKey, {
        algorithms: [AIP_ALGORITHM],
        clockTolerance: 5,
      });
      payload = result.payload;
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        throw new AipTokenExpiredError();
      }
      if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
        throw new AipSignatureError();
      }
      throw new AipTokenInvalidError(
        `Token verification failed: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }

    if (payload.iss !== issuerUrl) {
      throw new AipIssuerMismatchError(issuerUrl, payload.iss ?? "");
    }

    const aud = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
    if (aud !== options.audience) {
      throw new AipAudienceMismatchError(options.audience, aud ?? "");
    }

    const parsed = aipTokenClaimsSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AipTokenInvalidError(
        `Token claims validation failed: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`
      );
    }

    const claims = parsed.data;

    if (checkStatus) {
      await checkEntityStatus(claims.sub);
    }

    const identity: AipIdentity = {
      entityId: claims.sub,
      entityName: claims[AIP_CLAIMS.ENTITY_NAME],
      ownerId: claims[AIP_CLAIMS.OWNER_ID],
      ownerDisplayName: claims[AIP_CLAIMS.OWNER_DISPLAY_NAME],
      ownerEmail: claims[AIP_CLAIMS.OWNER_EMAIL],
      assurance: claims[AIP_CLAIMS.ASSURANCE] ?? DEFAULT_ASSURANCE,
      issuer: claims.iss,
      metadata: claims[AIP_CLAIMS.METADATA],
    };

    return identity;
  }

  return { verify };
}
