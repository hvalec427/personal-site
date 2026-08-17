import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// API_BASE_URL is set per-environment in Coolify (staging vs. production);
// locally it falls back to a hvalec-api instance running on localhost.
const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000";

writeFileSync(
  join(ROOT, "dist/assets/js/api-config.js"),
  `window.API_BASE_URL = ${JSON.stringify(apiBaseUrl)};\n`,
);
