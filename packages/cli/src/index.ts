import { Command } from "commander";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

import { AipClient } from "@aip/client";

const CONFIG_DIR = join(homedir(), ".aip");
const CONFIG_FILE = join(CONFIG_DIR, "credentials.json");

interface Credentials {
  entityId: string;
  privateKeyJwk: Record<string, unknown>;
  issuerUrl: string;
}

async function loadCredentials(): Promise<Credentials> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as Credentials;
  } catch {
    console.error(
      `No credentials found at ${CONFIG_FILE}\n` +
        "Run 'aip init' to configure your entity."
    );
    process.exit(1);
  }
}

function createClient(creds: Credentials): AipClient {
  return new AipClient({
    entityId: creds.entityId,
    privateKeyJwk: creds.privateKeyJwk,
    issuerUrl: creds.issuerUrl,
  });
}

const program = new Command();

program
  .name("aip")
  .description("Autonomous Identity Protocol CLI")
  .version("0.1.0");

program
  .command("init")
  .description("Configure AIP credentials for this machine")
  .requiredOption("--entity-id <id>", "Your entity UUID")
  .requiredOption(
    "--private-key <json>",
    "Your private key as a JSON string (JWK format)"
  )
  .option(
    "--issuer-url <url>",
    "AIA issuer URL",
    "https://registeragent.id"
  )
  .action(
    async (opts: {
      entityId: string;
      privateKey: string;
      issuerUrl: string;
    }) => {
      const privateKeyJwk = JSON.parse(opts.privateKey) as Record<
        string,
        unknown
      >;

      const credentials: Credentials = {
        entityId: opts.entityId,
        privateKeyJwk,
        issuerUrl: opts.issuerUrl,
      };

      await mkdir(CONFIG_DIR, { recursive: true });
      await writeFile(CONFIG_FILE, JSON.stringify(credentials, null, 2));
      console.log(`Credentials saved to ${CONFIG_FILE}`);
    }
  );

program
  .command("token")
  .description("Get an AIP ID token for a specific audience")
  .requiredOption("--aud <audience>", "Target audience (merchant origin)")
  .action(async (opts: { aud: string }) => {
    const creds = await loadCredentials();
    const client = createClient(creds);
    const token = await client.getToken(opts.aud);
    console.log(token);
  });

program
  .command("call <url>")
  .description("Make an authenticated request to a URL")
  .option("-X, --method <method>", "HTTP method", "GET")
  .option("-d, --data <body>", "Request body (JSON)")
  .option("-H, --header <header...>", "Additional headers (key:value)")
  .action(
    async (
      url: string,
      opts: { method: string; data?: string; header?: string[] }
    ) => {
      const creds = await loadCredentials();
      const client = createClient(creds);

      const headers: Record<string, string> = {};
      if (opts.header) {
        for (const h of opts.header) {
          const [key, ...rest] = h.split(":");
          if (key) {
            headers[key.trim()] = rest.join(":").trim();
          }
        }
      }

      if (opts.data) {
        headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      }

      const response = await client.fetch(url, {
        method: opts.method,
        headers,
        body: opts.data,
      });

      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? JSON.stringify(await response.json(), null, 2)
        : await response.text();

      console.log(`HTTP ${response.status} ${response.statusText}`);
      console.log(body);
    }
  );

program
  .command("discover <origin>")
  .description("Check if a website supports AIP")
  .action(async (origin: string) => {
    const { discoverAip } = await import("@aip/client");
    const discovery = await discoverAip(origin);

    if (discovery) {
      console.log("AIP supported!");
      console.log(JSON.stringify(discovery, null, 2));
    } else {
      console.log("AIP not supported at this origin.");
    }
  });

program
  .command("whoami")
  .description("Show current entity credentials")
  .action(async () => {
    const creds = await loadCredentials();
    console.log(`Entity ID: ${creds.entityId}`);
    console.log(`Issuer:    ${creds.issuerUrl}`);
  });

program.parse();
