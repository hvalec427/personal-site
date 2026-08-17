// API_BASE_URL is injected at build time (see scripts/write-api-config.js) so
// this points at the correct per-environment API instead of a hardcoded
// staging host reachable from production.
const GAMING_FEED_URL = `${window.API_BASE_URL}/gaming-feed`;

function formatGamingFeedDate(pubDate) {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

fetch(GAMING_FEED_URL)
  .then((res) => (res.ok ? res.json() : Promise.reject()))
  .then((data) => {
    const statusEl = document.getElementById("gaming-feed-status");
    const listEl = document.getElementById("gaming-feed-list");
    if (!statusEl || !listEl) return;

    const items = data.items || [];
    if (items.length === 0) {
      statusEl.textContent = "Nothing recent. Maybe I'm actually working.";
      return;
    }

    listEl.replaceChildren(
      ...items.map((item) => {
        const li = document.createElement("li");
        li.className = "gaming-feed-item";

        const main = document.createElement("div");
        main.className = "gaming-feed-item-main";

        const title = document.createElement("a");
        title.className = "gaming-feed-item-title";
        title.href = item.link;
        title.target = "_blank";
        title.rel = "noopener noreferrer";
        title.textContent = item.title;
        main.appendChild(title);

        if (item.description) {
          const desc = document.createElement("p");
          desc.className = "gaming-feed-item-desc";
          desc.textContent = item.description;
          main.appendChild(desc);
        }

        li.appendChild(main);

        const meta = document.createElement("div");
        meta.className = "gaming-feed-item-meta";

        if (item.source) {
          const source = document.createElement("span");
          source.className = "gaming-feed-item-source";
          source.textContent = item.source;
          meta.appendChild(source);
        }

        const date = document.createElement("time");
        date.className = "gaming-feed-item-date";
        date.textContent = formatGamingFeedDate(item.pubDate);
        meta.appendChild(date);

        li.appendChild(meta);

        return li;
      }),
    );

    statusEl.textContent = data.stale
      ? "Showing a cached copy — the feed's a little behind right now."
      : "";
    statusEl.hidden = !data.stale;
    listEl.hidden = false;
  })
  .catch(() => {
    const statusEl = document.getElementById("gaming-feed-status");
    if (statusEl) {
      statusEl.textContent =
        "Couldn't load recent activity. Probably for the best.";
    }
  });
