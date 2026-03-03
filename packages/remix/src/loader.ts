import { createAipVerifier, type AipVerifier } from "@aip/verify";
import type { AipIdentity } from "@aip/core";

export interface AipRemixConfig {
  issuerUrl: string;
  audience: string;
  checkStatus?: boolean;
}

let verifier: AipVerifier | null = null;

function getVerifier(config: AipRemixConfig): AipVerifier {
  if (!verifier) {
    verifier = createAipVerifier({
      issuerUrl: config.issuerUrl,
      checkStatus: config.checkStatus,
    });
  }
  return verifier;
}

/**
 * Extract and verify an AIP identity from a Remix request.
 * Returns null if no valid token is present.
 *
 * @param request - The incoming request
 * @param config - AIP configuration
 * @returns Verified identity or null
 *
 * @example
 * ```typescript
 * import { getAipIdentity } from "@aip/remix";
 *
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   const identity = await getAipIdentity(request, {
 *     issuerUrl: "https://registeragent.id",
 *     audience: "https://myapp.com",
 *   });
 *   if (!identity) return json({ error: "Unauthorized" }, 401);
 *   return json({ user: identity });
 * }
 * ```
 */
export async function getAipIdentity(
  request: Request,
  config: AipRemixConfig
): Promise<AipIdentity | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    return await getVerifier(config).verify(token, { audience: config.audience });
  } catch {
    return null;
  }
}

/**
 * Require an AIP identity from a Remix request.
 * Throws a 401 Response if no valid token is present.
 *
 * @param request - The incoming request
 * @param config - AIP configuration
 * @returns Verified identity
 * @throws Response with 401 status
 *
 * @example
 * ```typescript
 * import { requireAipIdentity } from "@aip/remix";
 *
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   const identity = await requireAipIdentity(request, config);
 *   return json({ user: identity });
 * }
 * ```
 */
export async function requireAipIdentity(
  request: Request,
  config: AipRemixConfig
): Promise<AipIdentity> {
  const identity = await getAipIdentity(request, config);
  if (!identity) {
    throw new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Valid AIP token required.",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  return identity;
}
