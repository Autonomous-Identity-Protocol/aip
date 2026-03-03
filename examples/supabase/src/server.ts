import express from "express";
import { createClient } from "@supabase/supabase-js";
import { createAipVerifier } from "@aip/verify";
import type { AipIdentity } from "@aip/core";

const app = express();
const port = 3003;

const issuerUrl = process.env.AIA_ISSUER_URL ?? "https://registeragent.id";
const audience = process.env.APP_AUDIENCE ?? `http://localhost:${port}`;

const supabase = createClient(
  process.env.SUPABASE_URL ?? "http://localhost:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "your-service-role-key"
);

const verifier = createAipVerifier({ issuerUrl });

async function findOrCreateUser(identity: AipIdentity) {
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("entity_id", identity.entityId)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("users")
    .insert({
      entity_id: identity.entityId,
      entity_name: identity.entityName,
      owner_email: identity.ownerEmail,
      owner_id: identity.ownerId,
      type: "autonomous",
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}

app.get("/", (_req, res) => {
  res.json({
    name: "AIP + Supabase Example",
    description: "Verify AIP tokens and auto-create Supabase users",
  });
});

app.get("/api/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Bearer token" });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const identity = await verifier.verify(token, { audience });
    const user = await findOrCreateUser(identity);

    res.json({
      data: {
        identity,
        supabase_user: user,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    res.status(401).json({ error: { message } });
  }
});

app.listen(port, () => {
  console.log(`Supabase AIP example running at http://localhost:${port}`);
});
