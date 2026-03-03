import { aipHook } from "@aip/sveltekit";

export const handle = aipHook({
  issuerUrl: "https://registeragent.id",
  audience: "http://localhost:3004",
});
