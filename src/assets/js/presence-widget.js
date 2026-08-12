function cssVarToHex(varName) {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  if (!raw) return null;

  const probe = document.createElement("div");
  probe.style.color = raw;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  document.body.removeChild(probe);

  const channels = rgb.match(/\d+/g);
  if (!channels) return null;
  const [r, g, b] = channels.map(Number);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

const script = document.createElement("script");
script.id = "presence-widget-script";
script.src = "https://presence.hvalec.com/widget.js";
script.async = true;
script.dataset.room = "hvalec.com";
script.dataset.badge = "false";

const accent = cssVarToHex("--highlight");
if (accent) script.dataset.accent = accent;

const surface = cssVarToHex("--surface");
if (surface) script.dataset.surface = surface;

document.head.appendChild(script);

window.updatePresenceWidgetColors = function updatePresenceWidgetColors() {
  const el = document.getElementById("presence-widget-script");
  if (!el) return;

  const accent = cssVarToHex("--highlight");
  if (accent) el.dataset.accent = accent;

  const surface = cssVarToHex("--surface");
  if (surface) el.dataset.surface = surface;
};
