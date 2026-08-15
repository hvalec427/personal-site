(() => {
  const video = document.getElementById("scanner-video");
  const startBtn = document.getElementById("scanner-start");
  const stopBtn = document.getElementById("scanner-stop");
  const status = document.getElementById("scanner-status");
  const results = document.getElementById("scanner-results");

  let stream = null;
  let detector = null;
  let rafId = null;
  const seen = new Set();

  const supportsBarcodeDetector = "BarcodeDetector" in window;

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("scanner-status-error", isError);
  }

  function addResult(value, format) {
    if (seen.has(value)) return;
    seen.add(value);

    const empty = results.querySelector(".scanner-results-empty");
    if (empty) empty.remove();

    const li = document.createElement("li");
    const formatLabel = document.createElement("span");
    formatLabel.className = "scanner-result-format";
    formatLabel.textContent = format;
    li.append(formatLabel, document.createTextNode(value));
    results.prepend(li);
  }

  async function scanFrame() {
    if (!stream || !detector) return;
    try {
      const codes = await detector.detect(video);
      for (const code of codes) {
        addResult(code.rawValue, code.format);
      }
    } catch {
      // A single failed frame isn't worth surfacing; keep scanning.
    }
    rafId = requestAnimationFrame(scanFrame);
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera access isn't supported in this browser.", true);
      return;
    }

    startBtn.disabled = true;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
    } catch (err) {
      setStatus(`Couldn't access the camera: ${err.message}`, true);
      startBtn.disabled = false;
      return;
    }

    video.srcObject = stream;
    video.classList.add("scanner-video-active");
    stopBtn.disabled = false;

    if (supportsBarcodeDetector) {
      detector = new window.BarcodeDetector();
      setStatus("Scanning for QR codes and barcodes…");
      rafId = requestAnimationFrame(scanFrame);
    } else {
      setStatus(
        "Camera is live, but this browser doesn't support automatic code detection (BarcodeDetector).",
        true,
      );
    }
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    detector = null;

    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      stream = null;
    }

    video.srcObject = null;
    video.classList.remove("scanner-video-active");
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus("Camera stopped.");
  }

  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);
  window.addEventListener("pagehide", stop);

  if (!supportsBarcodeDetector) {
    setStatus(
      "Heads up: this browser doesn't support the BarcodeDetector API, so codes won't be auto-decoded — the camera preview will still work.",
    );
  }
})();
