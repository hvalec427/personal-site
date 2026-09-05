import { spawnSync } from "child_process";
import { cpSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Builds the Astro homepage (site/) and overlays its static output onto the
// rest of the already-built dist/ — everything else in dist/ (logs,
// recipes, shelves, changelog, uses, secret, 404, assets) comes from the
// plain static build (build:static running before this) and is untouched;
// this only ever writes dist/index.html and dist/_astro/*.

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SITE = join(ROOT, "site");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(join(SITE, "node_modules"))) {
  run("npm", ["install"], SITE);
}
run("npm", ["run", "build"], SITE);

cpSync(join(SITE, "dist"), join(ROOT, "dist"), { recursive: true });
