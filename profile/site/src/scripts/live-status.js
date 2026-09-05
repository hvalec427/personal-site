// Hydrates the only genuinely real-time bits of the page: presence (from
// the existing /status endpoint, same one now-playing.js already polls),
// the clock, current weather, the public uptime status, and the visitor
// counter. Everything here degrades to "leave the server-rendered empty
// state alone" on any fetch failure — never shows a spinner, never fakes a
// number.

const WEATHER_WORDS = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Foggy",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent showers",
  95: "Thunderstorms",
  96: "Thunderstorms",
  99: "Thunderstorms",
};

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function tickClock() {
  setText(
    "spec-clock",
    new Date().toLocaleTimeString("en-GB", {
      timeZone: "Europe/Ljubljana",
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
}
tickClock();
setInterval(tickClock, 1000);

fetch(
  "https://api.open-meteo.com/v1/forecast?latitude=46.5547&longitude=15.6459&current=temperature_2m,weather_code&timezone=Europe%2FLjubljana",
)
  .then((res) => (res.ok ? res.json() : Promise.reject()))
  .then(({ current }) => {
    const word = WEATHER_WORDS[current.weather_code] ?? "";
    setText("spec-weather", `${Math.round(current.temperature_2m)}°C${word ? ", " + word : ""}`);
  })
  .catch(() => {});

fetch("https://uptime.hvalec.com/api/status-page/heartbeat/all")
  .then((res) => (res.ok ? res.json() : Promise.reject()))
  .then(({ heartbeatList }) => {
    const pill = document.getElementById("spec-uptime-pill");
    const label = document.getElementById("spec-uptime-label");
    if (!pill || !label) return;
    const latest = Object.values(heartbeatList).map((beats) => beats.at(-1)?.status);
    if (latest.length === 0) return;
    const up = latest.every((status) => status === 1);
    pill.classList.toggle("is-offline", !up);
    label.textContent = up ? "ONLINE" : "DEGRADED";
  })
  .catch(() => {});

const hasVisitedKey = "hvalecHasVisited";
const isReturning = localStorage.getItem(hasVisitedKey) === "1";
fetch(
  isReturning
    ? "https://abacus.jasoncameron.dev/get/hvalec-com/unique-visitors"
    : "https://abacus.jasoncameron.dev/hit/hvalec-com/unique-visitors",
)
  .then((res) => (res.ok ? res.json() : Promise.reject()))
  .then(({ value }) => {
    if (!isReturning) localStorage.setItem(hasVisitedKey, "1");
    setText("spec-visitor-count", `#${String(value).padStart(7, "0")}`);
  })
  .catch(() => {});

function earliestTimestamp(entry) {
  const candidates = [entry.sessionStartedAt, entry.lastPlayedAt, entry.asOf].filter(Boolean);
  if (candidates.length === 0) return null;
  return candidates.map((t) => new Date(t).getTime()).sort((a, b) => a - b)[0];
}

function formatElapsed(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function renderCurrentlyRow(container, slot, title, detail) {
  const row = document.createElement("div");
  row.className = "spec-currently-row";
  row.innerHTML = `
    <div class="spec-currently-thumb"></div>
    <div style="min-width:0">
      <div class="spec-currently-slot">${slot}</div>
      <div class="spec-currently-title"></div>
      <div class="spec-currently-detail"></div>
    </div>`;
  row.querySelector(".spec-currently-title").textContent = title;
  row.querySelector(".spec-currently-detail").textContent = detail;
  container.appendChild(row);
}

function refreshPresence() {
  if (!window.API_BASE_URL) return;
  fetch(`${window.API_BASE_URL}/status`)
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((entries) => {
      const online = entries.filter(
        (e) => e.source === "spotify" || (e.presence && e.presence !== "offline"),
      );

      // Header nav pill + sidebar STATUS card share the same on/off signal.
      const isOnline = online.length > 0;
      const timestamps = online.map(earliestTimestamp).filter((t) => t !== null);
      const since = timestamps.length ? Math.min(...timestamps) : null;

      for (const pill of document.querySelectorAll("[data-presence-pill]")) {
        pill.classList.toggle("is-offline", !isOnline);
      }
      for (const label of document.querySelectorAll("[data-presence-label]")) {
        label.textContent = isOnline ? "Online now" : "Away";
      }
      const durationEl = document.getElementById("spec-online-for");
      if (durationEl) {
        durationEl.textContent = isOnline && since ? formatElapsed(Date.now() - since) : "";
        durationEl.hidden = !(isOnline && since);
      }

      // "Currently" card: only ever shows what's actually true right now —
      // same rule now-playing.js already follows for the header widgets.
      const currentlyEl = document.getElementById("spec-currently-list");
      const currentlyEmpty = document.getElementById("spec-currently-empty");
      if (currentlyEl) {
        currentlyEl.replaceChildren();
        const spotify = entries.find((e) => e.source === "spotify");
        const playing = entries.find((e) => ["xbox", "steam", "psn"].includes(e.source));

        if (spotify) {
          renderCurrentlyRow(currentlyEl, "LISTENING", spotify.track, spotify.artist ?? "");
        }
        if (playing) {
          renderCurrentlyRow(
            currentlyEl,
            "PLAYING",
            playing.title,
            playing.console || playing.platform || playing.source,
          );
        }

        const hasAny = currentlyEl.children.length > 0;
        currentlyEl.hidden = !hasAny;
        if (currentlyEmpty) currentlyEmpty.hidden = hasAny;
      }
    })
    .catch(() => {});
}
refreshPresence();
setInterval(refreshPresence, 15000);
