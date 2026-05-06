let keyPressSequence = "";

let validPages = [];
// Fetch available pages dynamically from /sitemap.xml
fetch("/sitemap.xml")
  .then((res) => (res.ok ? res.text() : Promise.reject()))
  .then((xml) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const urls = Array.from(doc.querySelectorAll("url > loc"));
    validPages = urls
      .map((loc) => {
        try {
          const url = new URL(loc.textContent);
          // Get the last non-empty segment
          const parts = url.pathname.split("/").filter(Boolean);
          // Only allow top-level pages (no nested paths)
          return parts.length === 1 ? parts[0] : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  });

document.addEventListener("keydown", (event) => {
  const active = document.activeElement;
  const isEditable =
    active &&
    (active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.isContentEditable);
  if (isEditable) return;

  // Only consider single-character keys
  if (event.key.length === 1) {
    keyPressSequence += event.key.toLowerCase();
    // Limit to longest valid page name
    const maxLen = Math.max(...validPages.map((p) => p.length));
    if (keyPressSequence.length > maxLen) {
      keyPressSequence = keyPressSequence.slice(-maxLen);
    }
    // Check for any valid page match
    for (const page of validPages) {
      if (keyPressSequence.endsWith(page)) {
        window.location.href = `/${page}`;
        keyPressSequence = "";
        break;
      }
    }
  }
});
