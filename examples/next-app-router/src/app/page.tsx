export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>AIP Example — Next.js App Router</h1>
      <p>This app demonstrates AIP token verification.</p>
      <h2>Protected Endpoints</h2>
      <ul>
        <li><code>GET /api/me</code> — Returns the authenticated entity identity</li>
        <li><code>GET /api/dashboard</code> — Protected dashboard data</li>
      </ul>
      <h2>Usage</h2>
      <pre>{`curl -H "Authorization: Bearer <AIP_TOKEN>" http://localhost:3001/api/me`}</pre>
    </main>
  );
}
