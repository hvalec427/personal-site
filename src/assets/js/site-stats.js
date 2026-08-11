function updateLocalTime() {
  const el = document.getElementById("local-time");
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString("en-GB", {
    timeZone: "Europe/Ljubljana",
  });
}

updateLocalTime();
setInterval(updateLocalTime, 1000);

fetch("/assets/deploy-time.json")
  .then((res) => (res.ok ? res.json() : Promise.reject()))
  .then(({ deployedAt, commit, siteStatus }) => {
    const uptimeEl = document.getElementById("uptime");
    if (uptimeEl) {
      const days = Math.floor((Date.now() - new Date(deployedAt)) / 86400000);
      uptimeEl.textContent =
        days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"} ago`;
    }

    const commitEl = document.getElementById("latest-commit");
    if (commitEl && commit?.hash) {
      const link = document.createElement("a");
      link.href = `https://github.com/hvalec427/personal-site/commit/${commit.hash}`;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = commit.hash;
      if (commit.message) link.title = commit.message;
      commitEl.replaceChildren(link);
    }

    const statusEl = document.getElementById("site-status");
    if (statusEl && siteStatus) {
      const link = document.createElement("a");
      link.href = "https://uptime.hvalec.com/status/all";
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent =
        siteStatus === "operational" ? "Operational" : "Degraded";
      link.className = `site-status-${siteStatus}`;
      statusEl.replaceChildren(link);
    }
  })
  .catch(() => {});

fetch("https://abacus.jasoncameron.dev/hit/hvalec-com/homepage")
  .then((res) => (res.ok ? res.json() : Promise.reject()))
  .then(({ value }) => {
    const el = document.getElementById("visitor-count");
    if (!el) return;
    el.textContent = `#${String(value).padStart(6, "0")}`;
  })
  .catch(() => {});

window.addEventListener("presence:update", (event) => {
  const el = document.getElementById("presence-count");
  if (!el || typeof event.detail.count !== "number") return;
  el.textContent = `${event.detail.count} online`;
});
