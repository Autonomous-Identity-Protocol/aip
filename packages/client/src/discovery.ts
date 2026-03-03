import {
  aipMerchantDiscoverySchema,
  WELL_KNOWN,
  type AipMerchantDiscovery,
} from "@aip/core";

/**
 * Discover if a website supports AIP by checking its `/.well-known/aip` endpoint.
 *
 * @param origin - The merchant origin (e.g., "https://merchant.com")
 * @param fetchImpl - Optional custom fetch implementation
 * @returns The merchant's AIP discovery document, or null if not supported
 *
 * @example
 * ```typescript
 * const discovery = await discoverAip("https://merchant.com");
 * if (discovery) {
 *   console.log(`Supports AIP! Audience: ${discovery.audience}`);
 * }
 * ```
 */
export async function discoverAip(
  origin: string,
  fetchImpl?: typeof globalThis.fetch
): Promise<AipMerchantDiscovery | null> {
  const url = new URL(WELL_KNOWN.AIP_MERCHANT, origin).toString();
  const doFetch = fetchImpl ?? globalThis.fetch;

  try {
    const response = await doFetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const body = await response.json();
    const data = body.data ?? body;
    const parsed = aipMerchantDiscoverySchema.safeParse(data);

    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}
