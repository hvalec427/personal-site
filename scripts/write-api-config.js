import { writeFileSync, readFileSync, readdirSync } from "fs";
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

// Every page's CSP hardcodes connect-src to *.hvalec.com, which only covers
// the API in prod/staging by coincidence (api.hvalec.com and
// staging-api.hvalec.com both match that wildcard). It doesn't cover local
// dev, where API_BASE_URL points at localhost — so instead of special-casing
// "local," derive the API's actual origin from the same env var everywhere
// and add it explicitly. Redundant with the wildcard in prod/staging
// (harmless), required in local dev. The wildcard itself stays — it also
// covers uptime.hvalec.com (see site-stats.js), unrelated to the API.
patchCspConnectSrc(join(ROOT, "dist"), new URL(apiBaseUrl).origin);

function patchCspConnectSrc(dir, origin) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      patchCspConnectSrc(full, origin);
      continue;
    }
    if (!entry.name.endsWith(".html")) continue;
    const html = readFileSync(full, "utf8");
    if (!html.includes("connect-src") || html.includes(origin)) continue;
    const patched = html.replace(
      /connect-src([^;]*);/,
      (_, sources) => `connect-src${sources} ${origin};`,
    );
    if (patched !== html) writeFileSync(full, patched);
  }
}
