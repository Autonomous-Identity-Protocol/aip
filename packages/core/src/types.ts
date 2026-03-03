/**
 * Identity object returned after verifying an AIP token.
 * This is the normalized shape merchants receive.
 */
export interface AipIdentity {
  /** Stable autonomous entity identifier (maps to JWT `sub`) */
  entityId: string;
  /** Display name of the autonomous entity */
  entityName: string;
  /** Stable owner identifier */
  ownerId: string;
  /** Owner display name */
  ownerDisplayName: string;
  /** Owner email address */
  ownerEmail: string;
  /** Assurance level (e.g., "basic") */
  assurance: string;
  /** Issuer URL that issued this token */
  issuer: string;
  /** Optional metadata blob (max 2KB) */
  metadata?: Record<string, unknown>;
}

/**
 * Claims contained in an AIP ID Token (JWT payload).
 */
export interface AipTokenClaims {
  /** Issuer identifier (AIA) */
  iss: string;
  /** Subject — autonomous entity ID */
  sub: string;
  /** Audience — merchant origin/domain */
  aud: string;
  /** Issued at (unix timestamp) */
  iat: number;
  /** Expiration (unix timestamp) */
  exp: number;

  /** Display name of the autonomous entity */
  aip_entity_name: string;
  /** Stable owner ID */
  aip_owner_id: string;
  /** Owner display name */
  aip_owner_display_name: string;
  /** Owner email */
  aip_owner_email: string;
  /** Optional metadata blob */
  aip_metadata?: Record<string, unknown>;
  /** Assurance level */
  aip_assurance?: string;
}

/**
 * Claims in the client assertion JWT that agents send to the token endpoint.
 */
export interface AipClientAssertionClaims {
  /** Issuer — entity_id */
  iss: string;
  /** Subject — entity_id */
  sub: string;
  /** Audience — AIA token endpoint URL */
  aud: string;
  /** Issued at */
  iat: number;
  /** Expiration (short-lived, ~60s) */
  exp: number;
  /** Unique token identifier (nonce) */
  jti: string;
}

/**
 * Token response from the AIA token endpoint.
 */
export interface AipTokenResponse {
  /** The AIP ID Token (JWT) */
  id_token: string;
  /** Seconds until expiration */
  expires_in: number;
  /** Token type — always "Bearer" */
  token_type: "Bearer";
}

/**
 * Entity status as returned by the status endpoint.
 */
export interface AipEntityStatus {
  /** Current status */
  status: EntityStatus;
  /** Last status change timestamp (ISO 8601) */
  updated_at: string;
}

/**
 * AIA issuer discovery document (served at /.well-known/aip-issuer).
 */
export interface AipIssuerDiscovery {
  /** Issuer identifier */
  issuer: string;
  /** URL of the JWKS endpoint */
  jwks_uri: string;
  /** URL of the token endpoint */
  token_endpoint: string;
  /** URL of the status endpoint */
  status_endpoint: string;
  /** Supported signing algorithms */
  algorithms_supported: string[];
  /** Token time-to-live in seconds */
  token_ttl: number;
  /** List of required claims in ID tokens */
  required_claims: string[];
}

/**
 * Merchant discovery document (served at /.well-known/aip on merchant sites).
 */
export interface AipMerchantDiscovery {
  /** AIA issuer URL */
  issuer: string;
  /** Expected audience value */
  audience: string;
  /** Supported auth methods */
  auth_methods: string[];
}

/** Entity status enum values. */
export const EntityStatus = {
  Active: "active",
  Revoked: "revoked",
  Suspended: "suspended",
} as const;
export type EntityStatus = (typeof EntityStatus)[keyof typeof EntityStatus];

/** Owner status enum values. */
export const OwnerStatus = {
  Active: "active",
  Suspended: "suspended",
} as const;
export type OwnerStatus = (typeof OwnerStatus)[keyof typeof OwnerStatus];

/**
 * Result type for operations with expected failure modes.
 *
 * @example
 * ```typescript
 * function findEntity(id: string): Result<Entity, AipError> {
 *   const entity = db.find(id);
 *   if (!entity) return { ok: false, error: new AipEntityNotFoundError(id) };
 *   return { ok: true, data: entity };
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };
