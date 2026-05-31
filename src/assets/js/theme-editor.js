const VARIABLES = [
  "--background",
  "--primary",
  "--secondary",
  "--highlight",
  "--surface",
];

const current = {};
let ignoreMutation = false;

function resolveToHex(cssValue) {
  const div = document.createElement("div");
  div.style.display = "none";
  div.style.color = cssValue.trim();
  document.body.appendChild(div);
  const computed = getComputedStyle(div).color;
  document.body.removeChild(div);
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  const [, r, g, b] = match.map(Number);
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function readCurrentColors() {
  const style = getComputedStyle(document.documentElement);
  VARIABLES.forEach((v) => {
    const raw = style.getPropertyValue(v);
    if (raw.trim()) {
      const hex = resolveToHex(raw);
      if (hex) current[v] = hex;
    }
  });
}

function updateCSSOutput() {
  const lines = VARIABLES.map((v) => `  ${v}: ${current[v]};`).join("\n");
  document.getElementById("css-output").textContent = `:root {\n${lines}\n}`;
}

function applyColor(variable, hex) {
  current[variable] = hex;
  ignoreMutation = true;
  document.documentElement.style.setProperty(variable, hex);
  Promise.resolve().then(() => {
    ignoreMutation = false;
  });
  updateCSSOutput();
}

function buildEditor() {
  const editor = document.getElementById("color-editor");
  editor.innerHTML = "";

  VARIABLES.forEach((variable) => {
    const row = document.createElement("div");
    row.className = "color-row";

    const label = document.createElement("span");
    label.className = "color-label";
    label.textContent = variable;

    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.className = "color-hex";
    hexInput.value = current[variable] ?? "";
    hexInput.maxLength = 7;
    hexInput.spellcheck = false;

    const swatch = document.createElement("input");
    swatch.type = "color";
    swatch.className = "color-swatch";
    swatch.value = current[variable] ?? "#000000";
    swatch.title = variable;

    swatch.addEventListener("input", () => {
      hexInput.value = swatch.value;
      applyColor(variable, swatch.value);
    });

    hexInput.addEventListener("input", () => {
      const val = hexInput.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        swatch.value = val;
        applyColor(variable, val);
      }
    });

    row.appendChild(label);
    row.appendChild(hexInput);
    row.appendChild(swatch);
    editor.appendChild(row);
  });
}

function syncFromTheme() {
  readCurrentColors();
  buildEditor();
  updateCSSOutput();
}

const observer = new MutationObserver(() => {
  if (ignoreMutation) return;
  requestAnimationFrame(syncFromTheme);
});

document.addEventListener("DOMContentLoaded", () => {
  syncFromTheme();
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "style"],
  });
});
