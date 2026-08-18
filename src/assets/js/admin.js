(function () {
  const container = document.getElementById("admin-panel");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const urlError = params.get("error");
  if (urlError) {
    params.delete("error");
    const cleanQuery = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (cleanQuery ? `?${cleanQuery}` : ""),
    );
  }

  const ERROR_MESSAGES = {
    unauthorized: "You are not authorized.",
    auth_failed: "Login failed. Try again.",
  };

  function formatTimestamp(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderConnectionStatus(section, label, data, actions) {
    section.replaceChildren();

    const status = document.createElement("p");
    status.className = "connection-status-line";
    status.append(`${label}: `);
    const strong = document.createElement("strong");
    strong.textContent = data.linked ? "Connected" : "Not connected";
    status.appendChild(strong);

    const fetched = document.createElement("p");
    fetched.className = "connection-status-date";
    fetched.textContent = data.linkedAt
      ? `Last fetched: ${formatTimestamp(data.linkedAt)}`
      : "Last fetched: never";

    const actionsRow = document.createElement("div");
    actionsRow.className = "connection-actions";
    actionsRow.append(...actions);

    section.append(status, fetched, actionsRow);
  }

  function disconnectButton(endpoint, onDisconnected) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cv-button cv-button-secondary";
    button.textContent = "Disconnect";

    button.addEventListener("click", () => {
      button.disabled = true;
      fetch(`${window.API_BASE_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(onDisconnected)
        .catch(() => {
          button.disabled = false;
        });
    });

    return button;
  }

  function renderXboxStatus(section, data) {
    const fetchButton = document.createElement("button");
    fetchButton.type = "button";
    fetchButton.className = "cv-button";
    fetchButton.textContent = data.linked ? "Fetch now" : "Login with Xbox";

    fetchButton.addEventListener("click", () => {
      fetchButton.disabled = true;
      fetchButton.textContent = "Fetching…";
      fetch(`${window.API_BASE_URL}/auth/xbox`, {
        method: "POST",
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((updated) => renderXboxStatus(section, updated))
        .catch(() => {
          fetchButton.disabled = false;
          fetchButton.textContent = "Fetch failed, retry";
        });
    });

    const actions = [fetchButton];
    if (data.linked) {
      actions.push(
        disconnectButton("/auth/xbox/disconnect", (updated) =>
          renderXboxStatus(section, updated),
        ),
      );
    }

    renderConnectionStatus(section, "Xbox", data, actions);
  }

  function renderXboxSection(section) {
    fetch(`${window.API_BASE_URL}/auth/xbox/status`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => renderXboxStatus(section, data))
      .catch(() => {});
  }

  function renderSpotifyStatus(section, data) {
    const connectButton = document.createElement("button");
    connectButton.type = "button";
    connectButton.className = "cv-button";
    connectButton.textContent = data.linked
      ? "Reconnect Spotify"
      : "Login with Spotify";

    connectButton.addEventListener("click", () => {
      connectButton.disabled = true;
      fetch(`${window.API_BASE_URL}/auth/spotify/handoff`, {
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(({ url }) => {
          window.location.href = url;
        })
        .catch(() => {
          connectButton.disabled = false;
          connectButton.textContent = "Login with Spotify (failed, retry)";
        });
    });

    const actions = [connectButton];
    if (data.linked) {
      actions.push(
        disconnectButton("/auth/spotify/disconnect", (updated) =>
          renderSpotifyStatus(section, updated),
        ),
      );
    }

    renderConnectionStatus(section, "Spotify", data, actions);
  }

  function renderSpotifySection(section) {
    fetch(`${window.API_BASE_URL}/auth/spotify/status`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => renderSpotifyStatus(section, data))
      .catch(() => {});
  }

  function renderSignedIn(email) {
    container.replaceChildren();

    const p = document.createElement("p");
    p.append("Signed in as ");
    const strong = document.createElement("strong");
    strong.textContent = email;
    p.appendChild(strong);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cv-button";
    button.id = "admin-logout";
    button.textContent = "Log out";

    const xboxSection = document.createElement("div");
    xboxSection.className = "connection-section";

    const spotifySection = document.createElement("div");
    spotifySection.className = "connection-section";

    container.append(p, button, xboxSection, spotifySection);

    button.addEventListener("click", () => {
      fetch(`${window.API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).finally(() => renderSignedOut());
    });

    renderXboxSection(xboxSection);
    renderSpotifySection(spotifySection);
  }

  function renderSignedOut(error) {
    const message =
      ERROR_MESSAGES[error] || "Nothing to see here unless you're me.";
    container.replaceChildren();

    const p = document.createElement("p");
    p.textContent = message;

    const link = document.createElement("a");
    link.href = `${window.API_BASE_URL}/auth/google`;
    link.className = "cv-button";
    link.textContent = "Login with Google";

    container.append(p, link);
  }

  fetch(`${window.API_BASE_URL}/auth/me`, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((data) => renderSignedIn(data.email))
    .catch(() => renderSignedOut(urlError));
})();
