import { createAipVerifier, type AipVerifier } from "@aip/verify";

export interface AipSvelteKitConfig {
  issuerUrl: string;
  audience: string;
  checkStatus?: boolean;
}

let verifier: AipVerifier | null = null;

/**
 * SvelteKit server hook that verifies AIP tokens and makes identity available via locals.
 * Use in your `src/hooks.server.ts` file.
 *
 * @param config - AIP configuration
 * @returns SvelteKit handle function
 *
 * @example
 * ```typescript
 * // src/hooks.server.ts
 * import { aipHook } from "@aip/sveltekit";
 *
 * export const handle = aipHook({
 *   issuerUrl: "https://registeragent.id",
 *   audience: "https://myapp.com",
 * });
 * ```
 */
export function aipHook(config: AipSvelteKitConfig) {
  return async ({
    event,
    resolve,
  }: {
    event: any;
    resolve: (event: any) => Promise<Response>;
  }) => {
    const authHeader = event.request.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      if (!verifier) {
        verifier = createAipVerifier({
          issuerUrl: config.issuerUrl,
          checkStatus: config.checkStatus,
        });
      }

      try {
        const token = authHeader.slice(7);
        const identity = await verifier.verify(token, {
          audience: config.audience,
        });
        event.locals.aipIdentity = identity;
      } catch {
        event.locals.aipIdentity = null;
      }
    }

    return resolve(event);
  };
}
