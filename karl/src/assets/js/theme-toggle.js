function toggleTheme() {
  const root = document.documentElement;
  const currentTheme = root.getAttribute("data-theme");
  const button = document.querySelector(".theme-toggle");

  if (button) {
    if (currentTheme === "dark") {
      root.setAttribute("data-theme", "light");
      button.textContent = "🌙";
      localStorage.setItem("theme", "light");
    } else {
      root.setAttribute("data-theme", "dark");
      button.textContent = "☀️";
      localStorage.setItem("theme", "dark");
    }

    window.updatePresenceWidgetColors?.();
  }
}

window.toggleTheme = toggleTheme;

function restoreThemeFromStorage() {
  const savedTheme = localStorage.getItem("theme");
  const root = document.documentElement;

  if (savedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.setAttribute("data-theme", "light");
  }
}
window.restoreThemeFromStorage = restoreThemeFromStorage;

// Runs synchronously as this script loads (it's not async/defer) so the
// theme is set before first paint, same timing as the inline snippet this
// replaces — kept as a real script file instead of an inline <script> block
// so pages don't need 'unsafe-inline' in their Content-Security-Policy.
restoreThemeFromStorage();

function initializeTheme() {
  const button = document.querySelector(".theme-toggle");
  const savedTheme = localStorage.getItem("theme");

  if (button) {
    if (savedTheme === "dark") {
      button.textContent = "☀️";
    } else {
      button.textContent = "🌙";
    }

    button.addEventListener("click", toggleTheme);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTheme);
} else {
  initializeTheme();
}
