import { createAipVerifier, type AipVerifier } from "@aip/verify";
import type { AipNextConfig } from "./types.js";

let cachedVerifier: AipVerifier | null = null;
let cachedConfig: AipNextConfig | null = null;

/**
 * Get or create a singleton AIP verifier instance.
 * Re-uses the same verifier (and its JWKS cache) across requests.
 *
 * @param config - AIP configuration
 * @returns AipVerifier instance
 */
export function getVerifier(config: AipNextConfig): AipVerifier {
  if (cachedVerifier && cachedConfig === config) {
    return cachedVerifier;
  }

  cachedVerifier = createAipVerifier({
    issuerUrl: config.issuerUrl,
    checkStatus: config.checkStatus,
  });
  cachedConfig = config;

  return cachedVerifier;
}
