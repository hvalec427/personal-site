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

  function renderConnectionStatus(section, label, data, actions, accountLine) {
    section.replaceChildren();

    const status = document.createElement("p");
    status.className = "connection-status-line";
    status.append(`${label}: `);
    const strong = document.createElement("strong");
    strong.textContent = data.linked ? "Connected" : "Not connected";
    status.appendChild(strong);

    const children = [status];

    if (data.linked && accountLine) {
      const account = document.createElement("p");
      account.className = "connection-account-line";
      account.textContent = accountLine;
      children.push(account);
    }

    const fetched = document.createElement("p");
    fetched.className = "connection-status-date";
    fetched.textContent = data.linkedAt
      ? `Last fetched: ${formatTimestamp(data.linkedAt)}`
      : "Last fetched: never";
    children.push(fetched);

    const actionsRow = document.createElement("div");
    actionsRow.className = "connection-actions";
    actionsRow.append(...actions);
    children.push(actionsRow);

    section.append(...children);
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
    fetchButton.textContent = data.linked
      ? "Check connection"
      : "Login with Xbox";

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

    renderConnectionStatus(section, "Xbox", data, actions, data.gamertag);
  }

  function renderXboxSection(section) {
    fetch(`${window.API_BASE_URL}/auth/xbox/status`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => renderXboxStatus(section, data))
      .catch(() => {});
  }

  function renderSteamStatus(section, data) {
    let actions;

    if (data.linked) {
      const fetchButton = document.createElement("button");
      fetchButton.type = "button";
      fetchButton.className = "cv-button";
      fetchButton.textContent = "Check connection";

      fetchButton.addEventListener("click", () => {
        fetchButton.disabled = true;
        fetchButton.textContent = "Fetching…";
        fetch(`${window.API_BASE_URL}/auth/steam`, {
          method: "POST",
          credentials: "include",
        })
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((updated) => renderSteamStatus(section, updated))
          .catch(() => {
            fetchButton.disabled = false;
            fetchButton.textContent = "Fetch failed, retry";
          });
      });

      actions = [
        fetchButton,
        disconnectButton("/auth/steam/disconnect", (updated) =>
          renderSteamStatus(section, updated),
        ),
      ];
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "cv-input";
      input.placeholder = "Steam ID";
      input.setAttribute("aria-label", "Steam ID");

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = "cv-button";
      saveButton.textContent = "Link";

      saveButton.addEventListener("click", () => {
        const steamId = input.value.trim();
        if (!steamId) return;
        saveButton.disabled = true;
        saveButton.textContent = "Saving…";
        fetch(`${window.API_BASE_URL}/auth/steam`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ steamId }),
        })
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((updated) => renderSteamStatus(section, updated))
          .catch(() => {
            saveButton.disabled = false;
            saveButton.textContent = "Save failed, retry";
          });
      });

      actions = [input, saveButton];
    }

    const accountLine = data.personaName || null;
    renderConnectionStatus(section, "Steam", data, actions, accountLine);
  }

  function renderSteamSection(section) {
    fetch(`${window.API_BASE_URL}/auth/steam/status`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => renderSteamStatus(section, data))
      .catch(() => {});
  }

  function renderPsnStatus(section, data) {
    let actions;

    if (data.linked) {
      const fetchButton = document.createElement("button");
      fetchButton.type = "button";
      fetchButton.className = "cv-button";
      fetchButton.textContent = "Check connection";

      fetchButton.addEventListener("click", () => {
        fetchButton.disabled = true;
        fetchButton.textContent = "Fetching…";
        fetch(`${window.API_BASE_URL}/auth/psn`, {
          method: "POST",
          credentials: "include",
        })
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((updated) => renderPsnStatus(section, updated))
          .catch(() => {
            fetchButton.disabled = false;
            fetchButton.textContent = "Fetch failed, retry";
          });
      });

      actions = [
        fetchButton,
        disconnectButton("/auth/psn/disconnect", (updated) =>
          renderPsnStatus(section, updated),
        ),
      ];
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "cv-input";
      input.placeholder = "NPSSO token";
      input.setAttribute("aria-label", "NPSSO token");

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = "cv-button";
      saveButton.textContent = "Link";

      saveButton.addEventListener("click", () => {
        const npsso = input.value.trim();
        if (!npsso) return;
        saveButton.disabled = true;
        saveButton.textContent = "Saving…";
        fetch(`${window.API_BASE_URL}/auth/psn`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ npsso }),
        })
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((updated) => renderPsnStatus(section, updated))
          .catch(() => {
            saveButton.disabled = false;
            saveButton.textContent = "Save failed, retry";
          });
      });

      actions = [input, saveButton];
    }

    const accountLine = data.onlineId || null;
    renderConnectionStatus(section, "PSN", data, actions, accountLine);
  }

  function renderPsnSection(section) {
    fetch(`${window.API_BASE_URL}/auth/psn/status`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => renderPsnStatus(section, data))
      .catch(() => {});
  }

  function renderSpotifyStatus(section, data) {
    const connectButton = document.createElement("button");
    connectButton.type = "button";
    connectButton.className = "cv-button";
    connectButton.textContent = data.linked
      ? "Check connection"
      : "Login with Spotify";

    connectButton.addEventListener("click", () => {
      connectButton.disabled = true;

      if (data.linked) {
        connectButton.textContent = "Checking…";
        fetch(`${window.API_BASE_URL}/auth/spotify/refresh`, {
          method: "POST",
          credentials: "include",
        })
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((updated) => renderSpotifyStatus(section, updated))
          .catch(() => {
            connectButton.disabled = false;
            connectButton.textContent = "Check failed, retry";
          });
        return;
      }

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

    renderConnectionStatus(section, "Spotify", data, actions, data.displayName);
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

    const steamSection = document.createElement("div");
    steamSection.className = "connection-section";

    const psnSection = document.createElement("div");
    psnSection.className = "connection-section";

    container.append(
      p,
      button,
      xboxSection,
      spotifySection,
      steamSection,
      psnSection,
    );

    button.addEventListener("click", () => {
      fetch(`${window.API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).finally(() => renderSignedOut());
    });

    renderXboxSection(xboxSection);
    renderSpotifySection(spotifySection);
    renderSteamSection(steamSection);
    renderPsnSection(psnSection);
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
