const STATUS_URL = `${window.API_BASE_URL}/status`;

const CARD_WIDTH_PX = 240;
const CARD_PADDING_X_PX = 16;
const CARD_CONTENT_WIDTH_PX = CARD_WIDTH_PX - CARD_PADDING_X_PX * 2;
const TRACK_CONTENT_WIDTH_PX = CARD_CONTENT_WIDTH_PX - 1.3 * 13;

const FONT_BOLD = "600 13px 'Fira Code', monospace";
const FONT_NORMAL = "13px 'Fira Code', monospace";

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  return `${minutes}:${ss}`;
}

function progressBar(progressMs, durationMs) {
  const ratio =
    durationMs > 0 ? Math.min(1, Math.max(0, progressMs / durationMs)) : 0;
  const percent = `${ratio * 100}%`;

  const track = document.createElement("div");
  track.className = "now-playing-track-bar";

  const fill = document.createElement("div");
  fill.className = "now-playing-track-fill";
  fill.style.width = percent;

  const thumb = document.createElement("div");
  thumb.className = "now-playing-track-thumb";
  thumb.style.left = percent;

  track.append(fill, thumb);
  return track;
}

let measureCtx = null;
function textWidthPx(text, font) {
  if (!measureCtx)
    measureCtx = document.createElement("canvas").getContext("2d");
  measureCtx.font = font;
  return measureCtx.measureText(text).width;
}

const MARQUEE_PAUSE_MS = 1000;
const MARQUEE_SPEED_PX_PER_SEC = 30;

function scrollingText(text, font, availableWidth, now) {
  const width = textWidthPx(text, font);
  if (width <= availableWidth) {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
  }

  const scrollDistance = width - availableWidth;
  const scrollDurationMs = (scrollDistance / MARQUEE_SPEED_PX_PER_SEC) * 1000;
  const cycleMs = MARQUEE_PAUSE_MS * 2 + scrollDurationMs;
  const t = now % cycleMs;

  let offset;
  if (t < MARQUEE_PAUSE_MS) {
    offset = 0;
  } else if (t < MARQUEE_PAUSE_MS + scrollDurationMs) {
    offset = ((t - MARQUEE_PAUSE_MS) / scrollDurationMs) * scrollDistance;
  } else {
    offset = scrollDistance;
  }

  const wrap = document.createElement("span");
  wrap.className = "now-playing-scroll";

  const track = document.createElement("span");
  track.className = "now-playing-scroll-track";
  track.style.transform = `translateX(${-offset}px)`;
  track.textContent = text;

  wrap.appendChild(track);
  return wrap;
}

function idlePill(text) {
  const el = document.createElement("div");
  el.className = "status-badge";

  const dot = document.createElement("span");
  dot.className = "status-badge-dot";

  const label = document.createElement("span");
  label.textContent = text;

  el.append(dot, label);
  return el;
}

function xboxCard(status, now) {
  const card = document.createElement("div");
  card.className = "now-playing-card";

  const header = document.createElement("div");
  header.className = "now-playing-header";
  header.textContent = `Now playing on ${status.console || "Xbox"}`;

  const title = document.createElement("div");
  title.className = "now-playing-title";
  title.appendChild(
    scrollingText(status.title, FONT_BOLD, CARD_CONTENT_WIDTH_PX, now),
  );

  card.append(header, title);

  if (status.lastPlayedAt) {
    const elapsedMs = now - new Date(status.lastPlayedAt).getTime();
    const meta = document.createElement("div");
    meta.className = "now-playing-meta";
    meta.textContent = `Playing for ${formatElapsed(elapsedMs)}`;
    card.appendChild(meta);
  }

  return card;
}

function steamCard(status, now) {
  const card = document.createElement("div");
  card.className = "now-playing-card";

  const header = document.createElement("div");
  header.className = "now-playing-header";
  header.textContent = "Now playing on Steam";

  const title = document.createElement("div");
  title.className = "now-playing-title";
  title.appendChild(
    scrollingText(status.title, FONT_BOLD, CARD_CONTENT_WIDTH_PX, now),
  );

  card.append(header, title);

  if (status.lastPlayedAt) {
    const elapsedMs = now - new Date(status.lastPlayedAt).getTime();
    const meta = document.createElement("div");
    meta.className = "now-playing-meta";
    meta.textContent = `Playing for ${formatElapsed(elapsedMs)}`;
    card.appendChild(meta);
  }

  return card;
}

function spotifyCard(status, now) {
  const card = document.createElement("div");
  card.className = "now-playing-card";

  const header = document.createElement("div");
  header.className = "now-playing-header";
  header.textContent = "Now playing on Spotify";

  const artist = document.createElement("div");
  artist.className = "now-playing-artist";
  artist.append(
    "♫ ",
    scrollingText(status.artist, FONT_BOLD, CARD_CONTENT_WIDTH_PX - 14, now),
  );

  const track = document.createElement("div");
  track.className = "now-playing-track";
  track.appendChild(
    scrollingText(status.track, FONT_NORMAL, TRACK_CONTENT_WIDTH_PX, now),
  );

  card.append(header, artist, track);

  if (status.progressMs != null && status.durationMs != null) {
    const displayedMs = Math.min(
      status.durationMs,
      status.progressMs + (now - status.asOf),
    );

    const progress = progressBar(displayedMs, status.durationMs);

    const times = document.createElement("div");
    times.className = "now-playing-times";
    const elapsed = document.createElement("span");
    elapsed.textContent = formatDuration(displayedMs);
    const total = document.createElement("span");
    total.textContent = formatDuration(status.durationMs);
    times.append(elapsed, total);

    card.append(progress, times);
  }

  return card;
}

function renderStatus(status, now) {
  if (status.source === "xbox") return xboxCard(status, now);
  if (status.source === "steam") return steamCard(status, now);
  if (status.source === "spotify") return spotifyCard(status, now);
  return idlePill(status.title || status.track || "Playing");
}

const POLL_INTERVAL_MS = 5 * 1000;
const TICK_INTERVAL_MS = 100;

let latestStatuses = [];

function renderBadges() {
  const container = document.getElementById("status-badges");
  if (!container) return;

  const now = Date.now();
  const active = latestStatuses.filter((status) => status.playing);
  container.replaceChildren(
    ...(active.length > 0
      ? active.map((status) => renderStatus(status, now))
      : [idlePill("Currently offline")]),
  );
}

function refreshStatusBadges() {
  fetch(STATUS_URL)
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((statuses) => {
      latestStatuses = statuses;
      renderBadges();
    })
    .catch(() => {});
}

refreshStatusBadges();
setInterval(refreshStatusBadges, POLL_INTERVAL_MS);
setInterval(renderBadges, TICK_INTERVAL_MS);
