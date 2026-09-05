import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// SOURCE_COMMIT is Coolify's own env var for the deployed commit hash
// (requires "Include Source Commit in Build" enabled in the app's General
// settings). Nothing else sets it, so locally this is always null.
writeFileSync(
  join(ROOT, "dist/assets/deploy-time.json"),
  JSON.stringify({
    deployedAt: new Date().toISOString(),
    commit: {
      hash: process.env.SOURCE_COMMIT?.slice(0, 7) ?? null,
    },
  }),
);
