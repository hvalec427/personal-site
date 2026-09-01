import { spawnSync } from "child_process";

// Picks up a local .env (from `npm run secrets`) so `npm run dev`/`build`
// reflect it automatically. No-op if the file doesn't exist (e.g. Coolify).
try {
  process.loadEnvFile();
} catch {
  // no .env — fine locally before the first `npm run secrets`, and always
  // the case in Coolify, where DOPPLER_TOKEN below is the real source.
}

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
