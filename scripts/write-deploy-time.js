import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const git = (cmd) => {
  try {
    return execSync(cmd, { cwd: ROOT }).toString().trim();
  } catch {
    return null;
  }
};

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

writeFileSync(
  join(ROOT, "dist/assets/deploy-time.json"),
  JSON.stringify({
    deployedAt: new Date().toISOString(),
    commit: {
      hash: git("git rev-parse --short HEAD"),
      message: git("git log -1 --pretty=%s"),
    },
    siteStatus: await fetchSiteStatus(),
  }),
);
