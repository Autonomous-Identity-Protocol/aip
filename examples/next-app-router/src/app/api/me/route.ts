import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAip } from "@aip/next";

const aipConfig = {
  issuerUrl: process.env.AIA_ISSUER_URL ?? "https://registeragent.id",
};

export const GET = withAip(aipConfig, async (_request, identity) => {
  return NextResponse.json({
    data: {
      entity_id: identity.entityId,
      entity_name: identity.entityName,
      owner_id: identity.ownerId,
      owner_email: identity.ownerEmail,
      assurance: identity.assurance,
    },
  });
});
