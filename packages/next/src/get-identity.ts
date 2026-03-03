import type { AipIdentity } from "@aip/core";
import type { AipNextConfig } from "./types.js";
import { getVerifier } from "./verifier-singleton.js";

/**
 * Extract and verify an AIP identity from a Next.js request.
 * Works in App Router route handlers and server components.
 *
 * @param request - The incoming request (NextRequest or standard Request)
 * @param config - AIP configuration
 * @returns Verified identity or null if no valid token is present
 *
 * @example
 * ```typescript
 * import { getAipIdentity } from "@aip/next";
 *
 * export async function GET(request: NextRequest) {
 *   const identity = await getAipIdentity(request, {
 *     issuerUrl: "https://registeragent.id",
 *   });
 *
 *   if (!identity) {
 *     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   }
 *
 *   return NextResponse.json({ user: identity.entityName });
 * }
 * ```
 */
export async function getAipIdentity(
  request: Request,
  config: AipNextConfig
): Promise<AipIdentity | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) {
    return null;
  }

  const audience =
    config.audience ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(request.url).origin;

  const verifier = getVerifier(config);

  try {
    return await verifier.verify(token, { audience });
  } catch {
    return null;
  }
}
