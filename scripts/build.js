import { spawnSync } from "child_process";

// Coolify's Build Command is just the default `npm run build` — no config
// change needed. DOPPLER_TOKEN is only ever set there (never locally), so
// when it's present we fetch secrets and inject them before the real
// (build:static) build runs; otherwise this is a zero-overhead passthrough.
let env = process.env;
if (process.env.DOPPLER_TOKEN) {
  const { default: DopplerSDK } = await import("@dopplerhq/node-sdk");
  const doppler = new DopplerSDK({ accessToken: process.env.DOPPLER_TOKEN });
  const secrets = await doppler.secrets.download("", "", { format: "json" });
  env = { ...process.env, ...secrets };
}

const result = spawnSync("npm", ["run", "build:static"], {
  stdio: "inherit",
  env,
});

if (result.error) {
  console.error("Failed to run build:static:", result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
