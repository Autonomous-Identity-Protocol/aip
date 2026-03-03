/** Signing algorithm used across AIP (issuer + entity keys). */
export const AIP_ALGORITHM = "ES256" as const;

/** Elliptic curve used with ES256. */
export const AIP_CURVE = "P-256" as const;

/** Token time-to-live in seconds (15 minutes). */
export const TOKEN_TTL_SECONDS = 900;

/** Client assertion max lifetime in seconds (60 seconds). */
export const ASSERTION_MAX_TTL_SECONDS = 60;

/** Maximum metadata blob size in bytes (2KB). */
export const METADATA_MAX_BYTES = 2048;

/** Default JWKS cache TTL in milliseconds (1 hour). */
export const JWKS_CACHE_TTL_MS = 3_600_000;

/** Token refresh interval in milliseconds (10 minutes). */
export const TOKEN_REFRESH_INTERVAL_MS = 600_000;

/** AIP custom claim prefixes and names. */
export const AIP_CLAIMS = {
  ENTITY_NAME: "aip_entity_name",
  OWNER_ID: "aip_owner_id",
  OWNER_DISPLAY_NAME: "aip_owner_display_name",
  OWNER_EMAIL: "aip_owner_email",
  METADATA: "aip_metadata",
  ASSURANCE: "aip_assurance",
} as const;

/** Well-known endpoint paths. */
export const WELL_KNOWN = {
  AIP_ISSUER: "/.well-known/aip-issuer",
  JWKS: "/.well-known/jwks.json",
  AIP_MERCHANT: "/.well-known/aip",
} as const;

/** Default assurance level for MVP. */
export const DEFAULT_ASSURANCE = "basic" as const;
