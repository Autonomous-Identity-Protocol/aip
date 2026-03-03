import * as jose from "jose";
import {
  AIP_ALGORITHM,
  TOKEN_REFRESH_INTERVAL_MS,
  type AipTokenResponse,
} from "@aip/core";

/**
 * Configuration for the AIP client.
 */
export interface AipClientConfig {
  /** The entity's UUID */
  entityId: string;
  /** The entity's private key in JWK format */
  privateKeyJwk: jose.JWK;
  /** AIA issuer URL (default: "https://registeragent.id") */
  issuerUrl?: string;
  /** Custom fetch implementation */
  fetch?: typeof globalThis.fetch;
}

interface CachedToken {
  idToken: string;
  expiresAt: number;
}

/**
 * Agent-side client for the Autonomous Identity Protocol.
 * Handles token acquisition, caching, and automatic refresh.
 *
 * @example
 * ```typescript
 * const client = new AipClient({
 *   entityId: "your-entity-uuid",
 *   privateKeyJwk: { kty: "EC", crv: "P-256", ... },
 * });
 *
 * const response = await client.fetch("https://merchant.com/api/data");
 * ```
 */
export class AipClient {
  private readonly entityId: string;
  private readonly privateKeyJwk: jose.JWK;
  private readonly issuerUrl: string;
  private readonly tokenEndpoint: string;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly tokenCache = new Map<string, CachedToken>();
  private privateKey: jose.CryptoKey | jose.KeyObject | null = null;

  constructor(config: AipClientConfig) {
    this.entityId = config.entityId;
    this.privateKeyJwk = config.privateKeyJwk;
    this.issuerUrl = config.issuerUrl ?? "https://registeragent.id";
    this.tokenEndpoint = `${this.issuerUrl}/api/oauth/token`;
    this.fetchImpl = config.fetch ?? globalThis.fetch;
  }

  private async getPrivateKey(): Promise<jose.CryptoKey | jose.KeyObject> {
    if (!this.privateKey) {
      const key = await jose.importJWK(this.privateKeyJwk, AIP_ALGORITHM);
      if (key instanceof Uint8Array) {
        throw new Error("Expected an asymmetric key, got a symmetric key.");
      }
      this.privateKey = key;
    }
    return this.privateKey;
  }

  private async createClientAssertion(): Promise<string> {
    const privateKey = await this.getPrivateKey();
    const now = Math.floor(Date.now() / 1000);

    return new jose.SignJWT({})
      .setProtectedHeader({ alg: AIP_ALGORITHM, typ: "JWT" })
      .setIssuer(this.entityId)
      .setSubject(this.entityId)
      .setAudience(this.tokenEndpoint)
      .setIssuedAt(now)
      .setExpirationTime(now + 60)
      .setJti(crypto.randomUUID())
      .sign(privateKey);
  }

  /**
   * Get an AIP ID token for a specific audience (merchant origin).
   * Tokens are cached and refreshed automatically before expiry.
   *
   * @param audience - The merchant origin/domain (e.g., "https://merchant.com")
   * @returns The AIP ID token string
   *
   * @example
   * ```typescript
   * const token = await client.getToken("https://merchant.com");
   * ```
   */
  async getToken(audience: string): Promise<string> {
    const cached = this.tokenCache.get(audience);
    const now = Date.now();

    if (cached && cached.expiresAt - now > TOKEN_REFRESH_INTERVAL_MS) {
      return cached.idToken;
    }

    const assertion = await this.createClientAssertion();

    const response = await this.fetchImpl(this.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_assertion: assertion,
        client_assertion_type:
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        audience,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Token request failed (${response.status}): ${errorBody}`
      );
    }

    const body = (await response.json()) as { data: AipTokenResponse };
    const tokenResponse = body.data;

    this.tokenCache.set(audience, {
      idToken: tokenResponse.id_token,
      expiresAt: now + tokenResponse.expires_in * 1000,
    });

    return tokenResponse.id_token;
  }

  /**
   * Make an authenticated fetch request to a merchant API.
   * Automatically acquires and attaches the AIP Bearer token.
   *
   * @param url - The URL to fetch
   * @param init - Fetch init options (headers, method, body, etc.)
   * @returns Fetch response
   *
   * @example
   * ```typescript
   * const res = await client.fetch("https://merchant.com/api/dashboard");
   * const data = await res.json();
   * ```
   */
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const parsedUrl = new URL(url);
    const audience = parsedUrl.origin;

    const token = await this.getToken(audience);

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return this.fetchImpl(url, {
      ...init,
      headers,
    });
  }
}
