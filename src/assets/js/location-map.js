const MARIBOR = [46.5547, 15.6459];

function isDarkTheme() {
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();
  const probe = document.createElement("div");
  probe.style.display = "none";
  probe.style.color = bg;
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return true;
  const [, r, g, b] = match.map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

const mapEl = document.getElementById("location-map");
if (mapEl) {
  const map = L.map(mapEl, {
    center: MARIBOR,
    zoom: 12,
    zoomControl: false,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: false,
    keyboard: false,
    touchZoom: true,
  });

  map.attributionControl.setPrefix(false);

  const tint = document.createElement("div");
  tint.className = "location-map-tint";
  mapEl.appendChild(tint);

  const labelsPane = map.createPane("labelsPane");
  labelsPane.style.zIndex = 460;

  let currentScheme = null;
  let baseLayer = null;
  let labelsLayer = null;

  function applyMapTheme() {
    const scheme = isDarkTheme() ? "dark" : "light";
    if (scheme === currentScheme) return;
    currentScheme = scheme;

    if (baseLayer) map.removeLayer(baseLayer);
    if (labelsLayer) map.removeLayer(labelsLayer);

    baseLayer = L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${scheme}_nolabels/{z}/{x}/{y}{r}.png`,
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    labelsLayer = L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${scheme}_only_labels/{z}/{x}/{y}{r}.png`,
      {
        pane: "labelsPane",
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);
  }

  applyMapTheme();

  let themeCheckQueued = false;
  new MutationObserver(() => {
    if (themeCheckQueued) return;
    themeCheckQueued = true;
    requestAnimationFrame(() => {
      themeCheckQueued = false;
      applyMapTheme();
    });
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "style"],
  });

  requestAnimationFrame(() => map.invalidateSize());
  window.addEventListener("load", () => map.invalidateSize());
}

function updateLocationTime() {
  const el = document.getElementById("location-time");
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString("en-GB", {
    timeZone: "Europe/Ljubljana",
  });
}

updateLocationTime();
setInterval(updateLocationTime, 1000);
