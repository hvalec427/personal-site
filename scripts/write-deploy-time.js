import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const fetchSiteStatus = async () => {
  try {
    const res = await fetch(
      "https://uptime.hvalec.com/api/status-page/heartbeat/all",
    );
    if (!res.ok) return null;
    const { heartbeatList } = await res.json();
    const latestStatuses = Object.values(heartbeatList).map(
      (beats) => beats.at(-1)?.status,
    );
    if (latestStatuses.length === 0) return null;
    return latestStatuses.every((status) => status === 1)
      ? "operational"
      : "degraded";
  } catch {
    return null;
  }
};

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
    siteStatus: await fetchSiteStatus(),
  }),
);
