import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getAipIdentity } from "@aip/remix";

const config = {
  issuerUrl: "https://registeragent.id",
  audience: "http://localhost:3005",
};

export async function loader({ request }: LoaderFunctionArgs) {
  const identity = await getAipIdentity(request, config);
  if (!identity) {
    return json(
      { error: "Unauthorized", message: "Provide a valid Bearer token." },
      { status: 401 }
    );
  }
  return json({ user: identity });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  if ("error" in data) {
    return (
      <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
        <h1>AIP Example — Remix</h1>
        <p style={{ color: "#c00" }}>{data.message}</p>
        <p>Send a request with <code>Authorization: Bearer &lt;token&gt;</code></p>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>AIP Example — Remix</h1>
      <p>Authenticated as:</p>
      <pre style={{ background: "#f4f4f4", padding: "1rem", overflow: "auto" }}>
        {JSON.stringify(data.user, null, 2)}
      </pre>
    </main>
  );
}
