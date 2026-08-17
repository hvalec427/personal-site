import DopplerSDK from "@dopplerhq/node-sdk";
import { spawnSync } from "child_process";

// Coolify's Build Command. Fetches secrets from Doppler (via DOPPLER_TOKEN)
// straight into the build's environment — no CLI install, no .env on disk —
// then runs the normal static build, which bakes API_BASE_URL into
// dist/assets/js/api-config.js (see scripts/write-api-config.js).
const doppler = new DopplerSDK({ accessToken: process.env.DOPPLER_TOKEN });
const secrets = await doppler.secrets.download("", "", { format: "json" });

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: { ...process.env, ...secrets },
});

if (result.error) {
  console.error("Failed to run build:", result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
