import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAipIdentity } from "@aip/next";

const aipConfig = {
  issuerUrl: process.env.AIA_ISSUER_URL ?? "https://registeragent.id",
};

export async function GET(request: NextRequest) {
  const identity = await getAipIdentity(request, aipConfig);

  if (!identity) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Valid AIP token required." } },
      { status: 401 }
    );
  }

  return NextResponse.json({
    data: {
      message: `Welcome to the dashboard, ${identity.entityName}!`,
      owner: identity.ownerDisplayName,
      accessed_at: new Date().toISOString(),
    },
  });
}
