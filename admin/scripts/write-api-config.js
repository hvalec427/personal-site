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

// Stamped into every build so (a) the UI can show which build is live — no
// more guessing whether you're looking at the latest — and (b) every local
// asset URL gets a ?v=<buildMs> below, forcing the browser to refetch JS/CSS
// on each build instead of serving a stale cached copy.
const buildMs = Date.now();
const buildIso = new Date().toISOString();

writeFileSync(
  join(ROOT, "dist/assets/js/api-config.js"),
  `window.API_BASE_URL = ${JSON.stringify(apiBaseUrl)};\nwindow.ADMIN_BUILD_TIME = ${JSON.stringify(buildIso)};\n`,
);

// Same reasoning as profile's copy of this script: the page's CSP hardcodes
// connect-src to *.hvalec.com, which only covers the API in prod/staging by
// coincidence. Local dev needs the actual API_BASE_URL origin added too.
patchCspConnectSrc(join(ROOT, "dist"), new URL(apiBaseUrl).origin);
cacheBustAssets(join(ROOT, "dist"), buildMs);

// Append ?v=<buildMs> to every local /admin/assets/*.js|css reference so a
// plain refresh always pulls the current build (defeats browser caching of
// admin.js / admin-app.js / api-config.js / styles).
function cacheBustAssets(dir, v) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      cacheBustAssets(full, v);
      continue;
    }
    if (!entry.name.endsWith(".html")) continue;
    const html = readFileSync(full, "utf8");
    const patched = html.replace(/(\/admin\/assets\/[^"'?]+\.(?:js|css))(\?v=\d+)?/g, `$1?v=${v}`);
    if (patched !== html) writeFileSync(full, patched);
  }
}

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
