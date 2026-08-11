const MARIBOR = [46.5547, 15.6459];

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

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  const highlightIcon = L.divIcon({
    className: "location-marker",
    html: '<svg viewBox="0 0 24 36" width="28" height="42"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="currentColor"/><circle cx="12" cy="12" r="5" fill="var(--background)"/></svg>',
    iconSize: [28, 42],
    iconAnchor: [14, 42],
  });

  L.marker(MARIBOR, { icon: highlightIcon }).addTo(map);

  map.attributionControl.setPrefix(false);

  const tint = document.createElement("div");
  tint.className = "location-map-tint";
  mapEl.appendChild(tint);

  // The card row's flex widths can still be settling (webfonts, sibling
  // widget content) after Leaflet measures its container, leaving tiles
  // sized for a stale, smaller box.
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
