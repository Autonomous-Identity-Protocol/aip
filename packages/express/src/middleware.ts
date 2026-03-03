import type { Request, Response, NextFunction } from "express";
import { createAipVerifier, type AipVerifier } from "@aip/verify";
import type { AipIdentity } from "@aip/core";

/**
 * Configuration for the AIP Express middleware.
 */
export interface AipExpressConfig {
  /** AIA issuer URL (e.g., "https://registeragent.id") */
  issuerUrl: string;
  /** Expected audience for token verification */
  audience: string;
  /** Whether to check entity status on verification (default: false) */
  checkStatus?: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      aipIdentity?: AipIdentity;
    }
  }
}

/**
 * Express middleware that verifies AIP tokens and populates `req.aipIdentity`.
 * Returns 401 if no valid token is present.
 *
 * @param config - AIP configuration
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * import express from "express";
 * import { aipMiddleware } from "@aip/express";
 *
 * const app = express();
 *
 * app.use("/api", aipMiddleware({
 *   issuerUrl: "https://registeragent.id",
 *   audience: "https://myapp.com",
 * }));
 *
 * app.get("/api/me", (req, res) => {
 *   res.json({ identity: req.aipIdentity });
 * });
 * ```
 */
export function aipMiddleware(
  config: AipExpressConfig
): (req: Request, res: Response, next: NextFunction) => void {
  let verifier: AipVerifier | null = null;

  function getVerifier(): AipVerifier {
    if (!verifier) {
      verifier = createAipVerifier({
        issuerUrl: config.issuerUrl,
        checkStatus: config.checkStatus,
      });
    }
    return verifier;
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message:
            "Missing or invalid AIP token. Include a valid Bearer token in the Authorization header.",
        },
      });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const identity = await getVerifier().verify(token, {
        audience: config.audience,
      });
      req.aipIdentity = identity;
      next();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Token verification failed.";

      res.status(401).json({
        error: {
          code: "TOKEN_INVALID",
          message,
        },
      });
    }
  };
}
