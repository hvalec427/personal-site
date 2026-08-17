import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// API_BASE_URL is set per-environment (Doppler locally, Coolify in prod) —
// no fallback, since a silent default here means the login button quietly
// points at the wrong API instead of the build failing.
const apiBaseUrl = process.env.API_BASE_URL;
if (!apiBaseUrl) {
  console.error(
    "API_BASE_URL is not set. Run `npm run secrets` locally, or check DOPPLER_TOKEN in Coolify.",
  );
  process.exit(1);
}

writeFileSync(
  join(ROOT, "dist/assets/js/api-config.js"),
  `window.API_BASE_URL = ${JSON.stringify(apiBaseUrl)};\n`,
);
