import { z } from "zod";
import { METADATA_MAX_BYTES } from "./constants.js";

/**
 * Schema for validating AIP ID Token claims.
 * Used by `@aip/verify` to validate decoded JWT payloads.
 */
export const aipTokenClaimsSchema = z.object({
  iss: z.string().min(1),
  sub: z.string().uuid(),
  aud: z.string().min(1),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
  aip_entity_name: z.string().min(1),
  aip_owner_id: z.string().uuid(),
  aip_owner_display_name: z.string().min(1),
  aip_owner_email: z.string().email(),
  aip_metadata: z.record(z.unknown()).optional(),
  aip_assurance: z.string().optional(),
});

/**
 * Schema for validating client assertion claims.
 * Used by the AIA token endpoint to validate incoming assertions.
 */
export const aipClientAssertionClaimsSchema = z.object({
  iss: z.string().uuid(),
  sub: z.string().uuid(),
  aud: z.string().url(),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
  jti: z.string().min(1),
});

/**
 * Schema for token endpoint request body.
 */
export const tokenRequestSchema = z.object({
  grant_type: z.enum(["client_credentials", "urn:ietf:params:oauth:grant-type:jwt-bearer"]),
  client_assertion: z.string().min(1),
  client_assertion_type: z.literal("urn:ietf:params:oauth:client-assertion-type:jwt-bearer"),
  audience: z.string().min(1),
});

/**
 * Schema for entity creation request.
 */
export const createEntitySchema = z.object({
  name: z.string().min(1).max(100),
  metadata: z
    .record(z.unknown())
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return new TextEncoder().encode(JSON.stringify(val)).length <= METADATA_MAX_BYTES;
      },
      { message: `Metadata must be ${METADATA_MAX_BYTES} bytes or less when serialized` }
    ),
});

/**
 * Schema for entity update request.
 */
export const updateEntitySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  metadata: z
    .record(z.unknown())
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return new TextEncoder().encode(JSON.stringify(val)).length <= METADATA_MAX_BYTES;
      },
      { message: `Metadata must be ${METADATA_MAX_BYTES} bytes or less when serialized` }
    ),
});

/**
 * Schema for the issuer discovery document.
 */
export const aipIssuerDiscoverySchema = z.object({
  issuer: z.string().url(),
  jwks_uri: z.string().url(),
  token_endpoint: z.string().url(),
  status_endpoint: z.string().url(),
  algorithms_supported: z.array(z.string()),
  token_ttl: z.number().int().positive(),
  required_claims: z.array(z.string()),
});

/**
 * Schema for the merchant discovery document.
 */
export const aipMerchantDiscoverySchema = z.object({
  issuer: z.string().url(),
  audience: z.string().min(1),
  auth_methods: z.array(z.string()),
});
