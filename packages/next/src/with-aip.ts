import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AipIdentity } from "@aip/core";
import type { AipNextConfig } from "./types.js";
import { getAipIdentity } from "./get-identity.js";

/**
 * Wrap a Next.js App Router route handler with AIP verification.
 * Extracts and verifies the AIP token, passing the identity to the handler.
 * Returns 401 if no valid token is present.
 *
 * @param config - AIP configuration
 * @param handler - Route handler that receives the identity
 * @returns Wrapped route handler function
 *
 * @example
 * ```typescript
 * import { withAip } from "@aip/next";
 *
 * const aipConfig = { issuerUrl: "https://registeragent.id" };
 *
 * export const GET = withAip(aipConfig, async (request, identity) => {
 *   return NextResponse.json({
 *     message: `Hello, ${identity.entityName}!`,
 *     owner: identity.ownerEmail,
 *   });
 * });
 * ```
 */
export function withAip(
  config: AipNextConfig,
  handler: (
    request: NextRequest,
    identity: AipIdentity
  ) => Promise<NextResponse> | NextResponse
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const identity = await getAipIdentity(request, config);

    if (!identity) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message:
              "Missing or invalid AIP token. Include a valid Bearer token in the Authorization header.",
          },
        },
        { status: 401 }
      );
    }

    return handler(request, identity);
  };
}
