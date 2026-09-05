// Click handler only — the initial dark/light restore runs as a tiny
// blocking inline script in <head> (see Layout.astro) so it applies before
// first paint, same timing reasoning as the rest of profile's theme-toggle.js.
function initTheme() {
  const button = document.getElementById("spec-theme-toggle");
  const root = document.getElementById("spec-theme-root");
  if (!button || !root) return;

  button.addEventListener("click", () => {
    const isDark = root.getAttribute("data-dark") === "true";
    root.setAttribute("data-dark", String(!isDark));
    button.textContent = isDark ? "Dark" : "Light";
    try {
      localStorage.setItem("profile-theme", isDark ? "light" : "dark");
    } catch {}
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTheme);
} else {
  initTheme();
}
