// Tap/click the "." in the header logo 7 times in a row to unlock /secret.
// Uses click (not touchstart) so mouse and touch behave identically.
(function () {
  const TAPS_REQUIRED = 7;
  const TAP_WINDOW_MS = 1600;
  const SECRET_PATH = "/profile/secret";

  let tapCount = 0;
  let lastTapTime = 0;

  function replayPulse(el) {
    el.classList.remove("header-dot-pulse");
    // Force reflow so the animation restarts on rapid repeat taps.
    void el.offsetWidth;
    el.classList.add("header-dot-pulse");
  }

  function handleClick(event) {
    const dot = event.target.closest(".header-dot");
    if (!dot) return;

    // Swallow the click so the dot never navigates home mid-sequence.
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    if (now - lastTapTime > TAP_WINDOW_MS) {
      tapCount = 0;
    }
    lastTapTime = now;
    tapCount++;

    if (tapCount >= TAPS_REQUIRED) {
      tapCount = 0;
      dot.classList.remove("header-dot-pulse");
      dot.classList.add("header-dot-unlocked");
      window.setTimeout(() => {
        window.location.href = SECRET_PATH;
      }, 350);
      return;
    }

    replayPulse(dot);
  }

  document.addEventListener("click", handleClick);
})();
