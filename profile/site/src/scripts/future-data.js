// Every section here has no real backend yet (see PROFILE_PAGE_PLAN.md).
// Each fetch call names the endpoint that section will use once it exists —
// today they either 404/fail outright, or (habits) hit a real endpoint that
// exists but is admin-session-gated, so it 401s for anonymous visitors.
// Either way: on any non-2xx response or empty payload, the server-rendered
// empty state is left untouched. The instant a real endpoint starts
// returning data, the matching section lights up with no frontend changes.

function withApiBase(path) {
  return window.API_BASE_URL ? `${window.API_BASE_URL}${path}` : null;
}

function showContent(name) {
  const empty = document.querySelector(`[data-empty="${name}"]`);
  const content = document.querySelector(`[data-content="${name}"]`);
  if (empty) empty.hidden = true;
  if (content) content.hidden = false;
  return content;
}

function wireRemoteSection(name, path, isPresent, render) {
  const url = withApiBase(path);
  if (!url) return;
  fetch(url, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((data) => {
      if (!isPresent(data)) return;
      const content = showContent(name);
      if (content) render(content, data);
    })
    .catch(() => {});
}

// Habits — real contract (admin-tabs.js): { id, name, cadence, doneToday }[].
// No per-day history is exposed by that endpoint even in principle, so this
// renders today's status only, not a fabricated streak/heatmap.
wireRemoteSection(
  "habits",
  "/habits",
  (data) => Array.isArray(data) && data.length > 0,
  (content, habits) => {
    content.replaceChildren(
      ...habits.map((h) => {
        const row = document.createElement("div");
        row.className = "spec-habit-row";
        row.innerHTML = `
          <div class="spec-habit-head">
            <div class="spec-habit-name">
              <span style="font-weight:600;font-size:14px"></span>
              <span class="spec-habit-target"></span>
            </div>
            <span class="spec-habit-rate"></span>
          </div>`;
        row.querySelector(".spec-habit-name span").textContent = h.name;
        row.querySelector(".spec-habit-target").textContent = `TARGET ${h.cadence ?? ""}`.toUpperCase();
        row.querySelector(".spec-habit-rate").textContent = h.doneToday ? "DONE TODAY" : "NOT YET TODAY";
        return row;
      }),
    );
  },
);

// Motion — data model from the plan: { type, date, duration, distance, pace, gpxFile? }[]
wireRemoteSection(
  "motion",
  "/activities",
  (data) => Array.isArray(data) && data.length > 0,
  (content, sessions) => {
    content.replaceChildren(
      ...sessions.map((s) => {
        const row = document.createElement("div");
        row.className = "spec-data-table-row";
        row.style.gridTemplateColumns = "64px 1fr 84px 80px 84px";
        row.innerHTML = `
          <span style="font:500 10px/1 ui-monospace,monospace;letter-spacing:0.08em;color:var(--ss-accent);border:1px solid var(--ss-border);padding:4px 0;text-align:center"></span>
          <div style="min-width:0"><div style="font-weight:600;font-size:15px"></div></div>
          <span style="font:400 13px/1 ui-monospace,monospace;font-variant-numeric:tabular-nums"></span>
          <span style="font:400 13px/1 ui-monospace,monospace;font-variant-numeric:tabular-nums"></span>
          <span style="font:400 11px/1 ui-monospace,monospace;color:var(--ss-muted)"></span>`;
        row.children[0].textContent = String(s.type ?? "").toUpperCase();
        row.children[1].firstElementChild.textContent = s.route ?? s.type ?? "";
        row.children[2].textContent = s.distance ?? "—";
        row.children[3].textContent = s.duration ?? "—";
        row.children[4].textContent = s.date ?? "";
        return row;
      }),
    );
  },
);

// Play — reshaped Steam/Xbox/PSN playtime, per the plan (endpoint TBD, guessing /playtime).
wireRemoteSection(
  "play",
  "/playtime",
  (data) => Array.isArray(data) && data.length > 0,
  (content, games) => {
    content.replaceChildren(
      ...games.map((g) => {
        const row = document.createElement("div");
        row.className = "spec-data-table-row";
        row.style.gridTemplateColumns = "120px 1fr 100px 90px";
        row.innerHTML = `
          <div class="spec-placeholder" style="aspect-ratio:92/43"></div>
          <div style="min-width:0"><div style="font-weight:600;font-size:15px"></div></div>
          <div style="font:400 13px/1 ui-monospace,monospace;font-variant-numeric:tabular-nums"></div>
          <div style="font:400 11px/1 ui-monospace,monospace;color:var(--ss-muted)"></div>`;
        row.children[1].firstElementChild.textContent = g.title ?? "";
        row.children[2].textContent = g.hours != null ? `${g.hours}h` : "—";
        row.children[3].textContent = g.lastPlayedAt ?? "";
        return row;
      }),
    );
  },
);

// Music history + top artists — needs a new Spotify scope per the plan, not added yet.
wireRemoteSection(
  "music",
  "/music/recent",
  (data) => Array.isArray(data) && data.length > 0,
  (content, tracks) => {
    content.replaceChildren(
      ...tracks.map((t) => {
        const row = document.createElement("div");
        row.className = "spec-media-grid";
        row.style.gridTemplateColumns = "22px 1fr auto";
        row.innerHTML = `<span></span><span></span><span></span>`;
        row.children[1].textContent = `${t.title} — ${t.artist}`;
        row.children[2].textContent = t.playedAt ?? "";
        return row;
      }),
    );
  },
);

wireRemoteSection(
  "top-artists",
  "/music/top-artists",
  (data) => Array.isArray(data) && data.length > 0,
  (content, artists) => {
    content.replaceChildren(
      ...artists.map((a) => {
        const row = document.createElement("div");
        row.textContent = `${a.name} — ${a.plays}`;
        return row;
      }),
    );
  },
);

// Screens — nothing exists yet per the plan (would need TMDB integration).
wireRemoteSection(
  "screen",
  "/watched",
  (data) => Array.isArray(data) && data.length > 0,
  (content, items) => {
    content.replaceChildren(
      ...items.map((w) => {
        const card = document.createElement("div");
        card.innerHTML = `<div class="spec-placeholder" style="aspect-ratio:2/3"></div><div class="spec-media-title"></div><div class="spec-media-meta"></div>`;
        card.querySelector(".spec-media-title").textContent = w.title ?? "";
        card.querySelector(".spec-media-meta").textContent = [w.year, w.rating].filter(Boolean).join(" · ");
        return card;
      }),
    );
  },
);

// Aggregate totals — no derived-stats endpoint exists yet.
wireRemoteSection(
  "totals",
  "/stats/totals",
  (data) => data && Object.keys(data).length > 0,
  (content, totals) => {
    const set = (key, val) => {
      const el = content.querySelector(`[data-total="${key}"]`);
      if (el) el.textContent = val ?? "—";
    };
    set("books", totals.booksRead);
    set("films", totals.filmsSeen);
    set("hours", totals.hoursPlayed);
    set("tracks", totals.tracksScrobbled);
  },
);
