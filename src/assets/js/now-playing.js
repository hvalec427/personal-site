const STATUS_URL = `${window.API_BASE_URL}/status`;
const PC_STATUS_URL = `${window.API_BASE_URL}/pc-status`;

const CARD_WIDTH_PX = 280;
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

function idlePill(text, online = false) {
  const el = document.createElement("div");
  el.className = "status-badge";

  const dot = document.createElement("span");
  dot.className = online
    ? "status-badge-dot status-badge-dot--online"
    : "status-badge-dot";

  const label = document.createElement("span");
  label.textContent = text;

  el.append(dot, label);
  return el;
}

// Every known source gets a card in the status column at all times, so the
// column reads as a fixed set of slots rather than a list that only shows up
// when something happens to be active.
const SOURCE_LABELS = {
  discord: "Discord",
  spotify: "Spotify",
  xbox: "Xbox",
  steam: "Steam",
  psn: "PlayStation",
};
const SOURCE_ORDER = ["discord", "spotify", "xbox", "steam", "psn"];

function emptyCard(label) {
  const card = document.createElement("div");
  card.className = "now-playing-card now-playing-card--empty";

  const header = document.createElement("div");
  header.className = "now-playing-header now-playing-header--dot";

  const dot = document.createElement("span");
  dot.className = "status-badge-dot";

  const headerText = document.createElement("span");
  headerText.textContent = label;

  header.append(dot, headerText);
  card.appendChild(header);

  return card;
}

// Matches emptyCard/discordCard's dot + text header — the shared look
// every now-playing card header uses.
function dotHeader(text, dotClass = "") {
  const header = document.createElement("div");
  header.className = "now-playing-header now-playing-header--dot";

  const dot = document.createElement("span");
  dot.className = `status-badge-dot${
    dotClass ? ` status-badge-dot--${dotClass}` : ""
  }`;

  const headerText = document.createElement("span");
  headerText.textContent = text;

  header.append(dot, headerText);
  return header;
}

function xboxCard(status, now) {
  const card = document.createElement("div");
  card.className = "now-playing-card";

  const header = dotHeader(
    `Now playing on ${status.console || "Xbox"}`,
    "online",
  );

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

  const header = dotHeader("Now playing on Steam", "online");

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

function psnCard(status, now) {
  const card = document.createElement("div");
  card.className = "now-playing-card";

  const header = dotHeader(
    `Now playing on ${status.platform || "PlayStation"}`,
    "online",
  );

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

  const header = dotHeader("Now playing on Spotify", "online");

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

// Shared active/idle/dnd/offline vocabulary across every presence source
// (games, Spotify, Discord, PC status) — see hvalec-api/docs/presence-status.md.
const PRESENCE_LABELS = {
  active: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
};
const PRESENCE_DOT_CLASS = {
  active: "online",
  idle: "idle",
  dnd: "dnd",
};

function discordCard(status) {
  const card = document.createElement("div");
  card.className = "now-playing-card";

  const header = dotHeader(
    `${PRESENCE_LABELS[status.presence] || "Online"} on Discord`,
    PRESENCE_DOT_CLASS[status.presence] || "online",
  );
  card.appendChild(header);

  const row = document.createElement("div");
  row.className = "discord-account-card";

  const avatar = document.createElement("img");
  avatar.className = "discord-avatar";
  avatar.src = status.avatarUrl;
  avatar.alt = "";

  const info = document.createElement("div");
  info.className = "discord-account-info";

  const name = document.createElement("p");
  name.className = "discord-account-name";
  name.textContent = status.displayName || status.username;

  const username = document.createElement("p");
  username.className = "discord-account-username";
  username.textContent = `@${status.username}`;

  info.append(name, username);

  row.append(avatar, info);
  card.appendChild(row);

  return card;
}

function renderStatus(status, now) {
  if (status.source === "xbox") return xboxCard(status, now);
  if (status.source === "steam") return steamCard(status, now);
  if (status.source === "psn") return psnCard(status, now);
  if (status.source === "spotify") return spotifyCard(status, now);
  if (status.source === "discord") return discordCard(status);
  return idlePill(status.title || status.track || "Playing", true);
}

const WORK_HOURS_START = 8;
const WORK_HOURS_END = 16;

function ljubljanaHour(now) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Ljubljana",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
}

function ljubljanaWeekday(now) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Ljubljana",
    weekday: "short",
  }).format(now);
}

function isWorkHours(now) {
  const weekday = ljubljanaWeekday(now);
  if (weekday === "Sat" || weekday === "Sun") return false;
  const hour = ljubljanaHour(now);
  return hour >= WORK_HOURS_START && hour < WORK_HOURS_END;
}

function mostRecent(devices) {
  return devices.reduce((latest, device) =>
    !latest || new Date(device.receivedAt) > new Date(latest.receivedAt)
      ? device
      : latest,
  );
}

function pickDevice(devices, now) {
  const workDevices = devices.filter(
    (d) => d.category === "work" && d.presence !== "offline",
  );
  const personalDevices = devices.filter(
    (d) => d.category === "personal" && d.presence !== "offline",
  );
  if (workDevices.length === 0 && personalDevices.length === 0) return null;
  if (workDevices.length > 0 && personalDevices.length > 0) {
    return mostRecent(isWorkHours(now) ? workDevices : personalDevices);
  }
  return mostRecent(workDevices.length > 0 ? workDevices : personalDevices);
}

function formatGB(bytes) {
  return (bytes / 1024 ** 3).toFixed(1);
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function deviceStatRow(label, value) {
  const row = document.createElement("div");
  row.className = "stat-row";

  const labelEl = document.createElement("span");
  labelEl.className = "stat-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "stat-value";
  valueEl.textContent = value;

  row.append(labelEl, valueEl);
  return row;
}

function deviceCard(device, now) {
  const card = document.createElement("div");
  card.className = "now-playing-card";

  const header = dotHeader(
    `${PRESENCE_LABELS[device.presence] || "Online"} on ${device.deviceName}`,
    PRESENCE_DOT_CLASS[device.presence] || "online",
  );
  card.appendChild(header);

  if (device.sessionStartedAt) {
    const elapsedMs = now - new Date(device.sessionStartedAt).getTime();
    card.appendChild(deviceStatRow("Online for", formatElapsed(elapsedMs)));
  }

  if (device.cpu?.usagePercent != null) {
    card.appendChild(
      deviceStatRow("CPU", `${Math.round(device.cpu.usagePercent)}%`),
    );
  }
  if (device.memory?.usedBytes != null && device.memory?.totalBytes != null) {
    card.appendChild(
      deviceStatRow(
        "RAM",
        `${formatGB(device.memory.usedBytes)} / ${Math.round(
          device.memory.totalBytes / 1024 ** 3,
        )} GB`,
      ),
    );
  }
  if (device.gpu?.usagePercent != null) {
    card.appendChild(
      deviceStatRow("GPU", `${Math.round(device.gpu.usagePercent)}%`),
    );
  }
  if (device.uptimeSeconds != null) {
    card.appendChild(
      deviceStatRow("Uptime", formatUptime(device.uptimeSeconds)),
    );
  }

  return card;
}

const POLL_INTERVAL_MS = 5 * 1000;
const TICK_INTERVAL_MS = 100;

let latestStatuses = [];
let latestDevices = [];

// The whole container gets torn down and rebuilt every tick to drive the
// marquee scroll — fine normally, but it wipes any text selection inside it
// out from under the user. Checking selection.isCollapsed alone isn't
// enough: at the instant of mousedown, before any drag distance, the
// selection is still collapsed, so a tick landing in that window replaces
// the very node the user just pressed on and the drag never gets a chance
// to start. Track mousedown/mouseup directly so rebuilding pauses for the
// whole gesture, not just once a selection already exists.
let statusBadgesMouseDown = false;
document.addEventListener("mousedown", (event) => {
  const container = document.getElementById("status-badges");
  if (container && container.contains(event.target)) {
    statusBadgesMouseDown = true;
  }
});
document.addEventListener("mouseup", () => {
  statusBadgesMouseDown = false;
});

function renderBadges() {
  const container = document.getElementById("status-badges");
  if (!container) return;

  if (statusBadgesMouseDown) return;

  const selection = window.getSelection();
  if (
    selection &&
    !selection.isCollapsed &&
    container.contains(selection.anchorNode)
  ) {
    return;
  }

  const now = Date.now();
  const bySource = new Map(
    latestStatuses.map((status) => [status.source, status]),
  );
  const device = pickDevice(latestDevices, now);

  const slots = [
    ...SOURCE_ORDER.map((source) => {
      const status = bySource.get(source);
      const online = status?.presence && status.presence !== "offline";
      return {
        online,
        element: online
          ? renderStatus(status, now)
          : emptyCard(SOURCE_LABELS[source]),
      };
    }),
    {
      online: Boolean(device),
      element: device ? deviceCard(device, now) : emptyCard("PC"),
    },
  ];

  // Stable sort: online cards float to the top, offline ones sink to the
  // bottom, and relative order within each group stays as defined above.
  const rendered = slots
    .sort((a, b) => Number(b.online) - Number(a.online))
    .map((slot) => slot.element);

  reconcileBadges(container, rendered);
}

// container.replaceChildren(...) unconditionally tears down and reinserts
// every card each tick, even ones whose markup didn't change — that
// disconnect/reconnect is enough to collapse an expanded node in DevTools'
// Elements panel. Only touch the slots whose rendered markup actually
// differs from what's already there, so a static card (nothing to scroll)
// never gets its DOM node replaced at all, and an animating card's neighbors
// are left alone.
function reconcileBadges(container, newElements) {
  const current = Array.from(container.children);
  const max = Math.max(current.length, newElements.length);

  for (let i = 0; i < max; i++) {
    const currentEl = current[i];
    const newEl = newElements[i];

    if (!newEl) {
      currentEl?.remove();
      continue;
    }
    if (!currentEl) {
      container.appendChild(newEl);
      continue;
    }
    if (currentEl.outerHTML !== newEl.outerHTML) {
      currentEl.replaceWith(newEl);
    }
  }
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

function refreshDeviceStatus() {
  fetch(PC_STATUS_URL)
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((devices) => {
      latestDevices = devices;
      renderBadges();
    })
    .catch(() => {});
}

refreshStatusBadges();
refreshDeviceStatus();
setInterval(refreshStatusBadges, POLL_INTERVAL_MS);
setInterval(refreshDeviceStatus, POLL_INTERVAL_MS);
setInterval(renderBadges, TICK_INTERVAL_MS);
