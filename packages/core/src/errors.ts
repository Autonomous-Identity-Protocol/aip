/** Error codes for programmatic handling across all AIP packages. */
export const AipErrorCode = {
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_SIGNATURE_INVALID: "TOKEN_SIGNATURE_INVALID",
  AUDIENCE_MISMATCH: "AUDIENCE_MISMATCH",
  ISSUER_MISMATCH: "ISSUER_MISMATCH",
  ENTITY_NOT_FOUND: "ENTITY_NOT_FOUND",
  ENTITY_REVOKED: "ENTITY_REVOKED",
  ENTITY_SUSPENDED: "ENTITY_SUSPENDED",
  ASSERTION_INVALID: "ASSERTION_INVALID",
  ASSERTION_EXPIRED: "ASSERTION_EXPIRED",
  KEY_NOT_FOUND: "KEY_NOT_FOUND",
  JWKS_FETCH_FAILED: "JWKS_FETCH_FAILED",
  STATUS_CHECK_FAILED: "STATUS_CHECK_FAILED",
  METADATA_TOO_LARGE: "METADATA_TOO_LARGE",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type AipErrorCode = (typeof AipErrorCode)[keyof typeof AipErrorCode];

/**
 * Base error class for all AIP errors.
 * Includes a machine-readable `code` for programmatic handling.
 *
 * @example
 * ```typescript
 * try {
 *   await verifier.verify(token, { audience });
 * } catch (error) {
 *   if (error instanceof AipError) {
 *     console.log(error.code); // "TOKEN_EXPIRED"
 *   }
 * }
 * ```
 */
export class AipError extends Error {
  public readonly code: AipErrorCode;

  constructor(code: AipErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AipError";
    this.code = code;
  }
}

/** Thrown when a token has expired. */
export class AipTokenExpiredError extends AipError {
  constructor(message = "Token has expired. Request a new token from the AIA issuer.") {
    super(AipErrorCode.TOKEN_EXPIRED, message);
    this.name = "AipTokenExpiredError";
  }
}

/** Thrown when a token is malformed or cannot be parsed. */
export class AipTokenInvalidError extends AipError {
  constructor(message = "Token is malformed or cannot be decoded.") {
    super(AipErrorCode.TOKEN_INVALID, message);
    this.name = "AipTokenInvalidError";
  }
}

/** Thrown when token signature verification fails. */
export class AipSignatureError extends AipError {
  constructor(message = "Token signature is invalid. Ensure you are using the correct issuer JWKS.") {
    super(AipErrorCode.TOKEN_SIGNATURE_INVALID, message);
    this.name = "AipSignatureError";
  }
}

/** Thrown when the token audience does not match the expected audience. */
export class AipAudienceMismatchError extends AipError {
  constructor(expected: string, received: string) {
    super(
      AipErrorCode.AUDIENCE_MISMATCH,
      `Token audience "${received}" does not match expected "${expected}". Ensure the agent requests a token for the correct audience.`
    );
    this.name = "AipAudienceMismatchError";
  }
}

/** Thrown when the token issuer does not match the expected issuer. */
export class AipIssuerMismatchError extends AipError {
  constructor(expected: string, received: string) {
    super(
      AipErrorCode.ISSUER_MISMATCH,
      `Token issuer "${received}" does not match expected "${expected}".`
    );
    this.name = "AipIssuerMismatchError";
  }
}

/** Thrown when an entity is not found in the registry. */
export class AipEntityNotFoundError extends AipError {
  constructor(entityId: string) {
    super(
      AipErrorCode.ENTITY_NOT_FOUND,
      `Entity "${entityId}" not found. Verify the entity ID is correct and has been registered.`
    );
    this.name = "AipEntityNotFoundError";
  }
}

/** Thrown when an entity has been revoked. */
export class AipEntityRevokedError extends AipError {
  constructor(entityId: string) {
    super(
      AipErrorCode.ENTITY_REVOKED,
      `Entity "${entityId}" has been revoked. Contact the entity owner.`
    );
    this.name = "AipEntityRevokedError";
  }
}

/** Thrown when an entity has been suspended. */
export class AipEntitySuspendedError extends AipError {
  constructor(entityId: string) {
    super(
      AipErrorCode.ENTITY_SUSPENDED,
      `Entity "${entityId}" has been suspended. Contact the entity owner.`
    );
    this.name = "AipEntitySuspendedError";
  }
}

/** Thrown when the client assertion is invalid. */
export class AipAssertionInvalidError extends AipError {
  constructor(message = "Client assertion is invalid or malformed.") {
    super(AipErrorCode.ASSERTION_INVALID, message);
    this.name = "AipAssertionInvalidError";
  }
}

/** Thrown when JWKS cannot be fetched from the issuer. */
export class AipJwksFetchError extends AipError {
  constructor(issuerUrl: string, cause?: Error) {
    super(
      AipErrorCode.JWKS_FETCH_FAILED,
      `Failed to fetch JWKS from "${issuerUrl}". Ensure the issuer URL is correct and accessible.`,
      cause ? { cause } : undefined
    );
    this.name = "AipJwksFetchError";
  }
}

/** Thrown when metadata exceeds the maximum allowed size. */
export class AipMetadataTooLargeError extends AipError {
  constructor(sizeBytes: number, maxBytes: number) {
    super(
      AipErrorCode.METADATA_TOO_LARGE,
      `Metadata size (${sizeBytes} bytes) exceeds maximum (${maxBytes} bytes).`
    );
    this.name = "AipMetadataTooLargeError";
  }
}

/** Thrown when a request is rate limited. */
export class AipRateLimitedError extends AipError {
  constructor(retryAfterSeconds?: number) {
    const retryMsg = retryAfterSeconds
      ? ` Retry after ${retryAfterSeconds} seconds.`
      : "";
    super(
      AipErrorCode.RATE_LIMITED,
      `Rate limit exceeded.${retryMsg}`
    );
    this.name = "AipRateLimitedError";
  }
}
