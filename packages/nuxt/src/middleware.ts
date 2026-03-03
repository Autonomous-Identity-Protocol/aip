import { createAipVerifier, type AipVerifier } from "@aip/verify";
import type { AipIdentity } from "@aip/core";

export interface AipNuxtConfig {
  issuerUrl: string;
  audience: string;
  checkStatus?: boolean;
}

let verifier: AipVerifier | null = null;

function getVerifier(config: AipNuxtConfig): AipVerifier {
  if (!verifier) {
    verifier = createAipVerifier({
      issuerUrl: config.issuerUrl,
      checkStatus: config.checkStatus,
    });
  }
  return verifier;
}

/**
 * Extract and verify an AIP identity from a Nuxt event request.
 * Returns null if no valid token is present.
 *
 * @param event - H3 event object
 * @param config - AIP configuration
 * @returns Verified identity or null
 *
 * @example
 * ```typescript
 * // server/api/me.get.ts
 * import { getAipIdentity } from "@aip/nuxt";
 *
 * export default defineEventHandler(async (event) => {
 *   const identity = await getAipIdentity(event, {
 *     issuerUrl: "https://registeragent.id",
 *     audience: "https://myapp.com",
 *   });
 *   if (!identity) throw createError({ statusCode: 401 });
 *   return { identity };
 * });
 * ```
 */
export async function getAipIdentity(
  event: {
    node: {
      req: { headers: Record<string, string | string[] | undefined> };
    };
  },
  config: AipNuxtConfig
): Promise<AipIdentity | null> {
  const authHeader = event.node.req.headers.authorization;
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice(7);
  if (!token) return null;

  try {
    return await getVerifier(config).verify(token, {
      audience: config.audience,
    });
  } catch {
    return null;
  }
}

/**
 * Create a Nuxt server middleware that verifies AIP tokens.
 * Attaches the identity to the event context.
 *
 * @param config - AIP configuration
 * @returns H3 event handler
 *
 * @example
 * ```typescript
 * // server/middleware/aip.ts
 * import { createAipEventHandler } from "@aip/nuxt";
 *
 * export default createAipEventHandler({
 *   issuerUrl: "https://registeragent.id",
 *   audience: "https://myapp.com",
 * });
 * ```
 */
export function createAipEventHandler(config: AipNuxtConfig) {
  return async (
    event: {
      node: {
        req: { headers: Record<string, string | string[] | undefined> };
      };
      context: { aipIdentity?: AipIdentity | null };
    }
  ) => {
    const identity = await getAipIdentity(event, config);
    event.context.aipIdentity = identity;
  };
}
