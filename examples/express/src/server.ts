import express from "express";
import { aipMiddleware } from "@aip/express";

const app = express();
const port = 3002;

const issuerUrl = process.env.AIA_ISSUER_URL ?? "https://registeragent.id";
const audience = process.env.APP_AUDIENCE ?? `http://localhost:${port}`;

app.get("/", (_req, res) => {
  res.json({
    name: "AIP Example — Express",
    endpoints: {
      "GET /api/me": "Returns entity identity (protected)",
      "GET /api/data": "Returns sample data (protected)",
    },
  });
});

app.use(
  "/api",
  aipMiddleware({
    issuerUrl,
    audience,
  })
);

app.get("/api/me", (req, res) => {
  res.json({ data: req.aipIdentity });
});

app.get("/api/data", (req, res) => {
  res.json({
    data: {
      message: `Hello, ${req.aipIdentity?.entityName}!`,
      items: [
        { id: 1, name: "Item A" },
        { id: 2, name: "Item B" },
      ],
      accessed_at: new Date().toISOString(),
    },
  });
});

app.listen(port, () => {
  console.log(`Express AIP example running at http://localhost:${port}`);
});
