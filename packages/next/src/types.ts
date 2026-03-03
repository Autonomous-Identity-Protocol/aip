/**
 * Configuration for AIP Next.js integration.
 */
export interface AipNextConfig {
  /** AIA issuer URL (e.g., "https://registeragent.id") */
  issuerUrl: string;
  /** Expected audience for token verification. Defaults to NEXT_PUBLIC_APP_URL env var. */
  audience?: string;
  /** Whether to check entity status on verification (default: false) */
  checkStatus?: boolean;
}
