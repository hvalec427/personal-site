// API_BASE_URL is injected at build time (see scripts/write-api-config.js).
const XBOX_STATUS_URL = `${window.API_BASE_URL}/xbox-status`;

fetch(XBOX_STATUS_URL)
  .then((res) => (res.ok ? res.json() : Promise.reject()))
  .then((data) => {
    const badge = document.getElementById("xbox-status-badge");
    const label = document.getElementById("xbox-now-status");
    if (!badge || !label) return;

    label.textContent = data.playing ? data.game : "Not playing anything";
    badge.classList.toggle("xbox-status-badge-active", Boolean(data.playing));
    badge.hidden = false;
  })
  .catch(() => {});
