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

  function hintLine(...nodes) {
    const p = document.createElement("p");
    p.className = "connection-hint";
    p.append(...nodes);
    return p;
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

    if (!data.linked) {
      section.appendChild(
        hintLine(
          "Find your Steam ID by opening your Steam profile in a browser — it's the number in the page URL (steamcommunity.com/profiles/<id>).",
        ),
      );
    }
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

    if (!data.linked) {
      const link = document.createElement("a");
      link.href = "https://ca.account.sony.com/api/v1/ssocookie";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "ca.account.sony.com/api/v1/ssocookie";

      section.appendChild(
        hintLine(
          "Get an NPSSO token by logging into playstation.com, then visiting ",
          link,
          " in the same browser and copying the npsso value from the JSON response.",
        ),
      );
    }
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

  function renderDiscordStatus(section, data) {
    const connectButton = document.createElement("button");
    connectButton.type = "button";
    connectButton.className = "cv-button";
    connectButton.textContent = data.linked
      ? "Check connection"
      : "Login with Discord";

    connectButton.addEventListener("click", () => {
      connectButton.disabled = true;

      if (data.linked) {
        connectButton.textContent = "Checking…";
        fetch(`${window.API_BASE_URL}/auth/discord/refresh`, {
          method: "POST",
          credentials: "include",
        })
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((updated) => renderDiscordStatus(section, updated))
          .catch(() => {
            connectButton.disabled = false;
            connectButton.textContent = "Check failed, retry";
          });
        return;
      }

      fetch(`${window.API_BASE_URL}/auth/discord/handoff`, {
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(({ url }) => {
          window.location.href = url;
        })
        .catch(() => {
          connectButton.disabled = false;
          connectButton.textContent = "Login with Discord (failed, retry)";
        });
    });

    const actions = [connectButton];
    if (data.linked) {
      actions.push(
        disconnectButton("/auth/discord/disconnect", (updated) =>
          renderDiscordStatus(section, updated),
        ),
      );
    }

    const accountLine = data.username
      ? `${data.displayName || data.username} (@${data.username})`
      : null;
    renderConnectionStatus(section, "Discord", data, actions, accountLine);
  }

  function renderDiscordSection(section) {
    fetch(`${window.API_BASE_URL}/auth/discord/status`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => renderDiscordStatus(section, data))
      .catch(() => {});
  }

  function formatCategory(category) {
    return category === "work" ? "Work" : "Personal";
  }

  function renderDeviceItem(device, onUpdated) {
    const item = document.createElement("div");
    item.className = "device-item";

    const info = document.createElement("div");
    info.className = "device-info";

    const name = document.createElement("p");
    name.className = "device-name";
    name.append(device.name, " ");
    const badge = document.createElement("span");
    badge.className = "device-category-badge";
    badge.textContent = formatCategory(device.category);
    name.appendChild(badge);

    const renameInput = document.createElement("input");
    renameInput.type = "text";
    renameInput.className = "cv-input";
    renameInput.value = device.name;
    renameInput.setAttribute("aria-label", "Device name");
    renameInput.hidden = true;

    const meta = document.createElement("p");
    meta.className = "device-meta";
    meta.textContent = device.lastSeenAt
      ? `Last seen: ${formatTimestamp(device.lastSeenAt)}`
      : "Last seen: never";

    info.append(name, renameInput, meta);

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "cv-button cv-button-secondary";
    renameButton.textContent = "Rename";
    renameButton.addEventListener("click", () => {
      if (renameInput.hidden) {
        name.hidden = true;
        renameInput.hidden = false;
        renameButton.textContent = "Save";
        renameInput.focus();
        return;
      }

      const newName = renameInput.value.trim();
      if (!newName) return;
      renameButton.disabled = true;
      fetch(`${window.API_BASE_URL}/admin/pc-tokens/${device.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      })
        .then((res) => (res.ok ? onUpdated() : Promise.reject()))
        .catch(() => {
          renameButton.disabled = false;
        });
    });

    const revokeButton = document.createElement("button");
    revokeButton.type = "button";
    revokeButton.className = "cv-button cv-button-secondary";
    revokeButton.textContent = "Revoke";
    revokeButton.addEventListener("click", () => {
      revokeButton.disabled = true;
      fetch(`${window.API_BASE_URL}/admin/pc-tokens/${device.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => (res.ok ? onUpdated() : Promise.reject()))
        .catch(() => {
          revokeButton.disabled = false;
        });
    });

    const actions = document.createElement("div");
    actions.className = "device-item-actions";
    actions.append(renameButton, revokeButton);

    item.append(info, actions);
    return item;
  }

  function renderNewDeviceToken(container, result) {
    container.replaceChildren();

    const p = document.createElement("p");
    p.className = "connection-account-line";
    p.textContent = `Token for "${result.name}" — copy it now, it won't be shown again:`;

    const tokenBox = document.createElement("code");
    tokenBox.className = "device-token-box";
    tokenBox.textContent = result.token;

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "cv-button";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(result.token).then(() => {
        copyButton.textContent = "Copied!";
      });
    });

    container.append(p, tokenBox, copyButton);
  }

  function renderDevicesSection(section) {
    section.replaceChildren();

    const heading = document.createElement("p");
    heading.className = "connection-status-line";
    heading.textContent = "Devices";

    const list = document.createElement("div");
    list.className = "device-list";

    const tokenReveal = document.createElement("div");

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "cv-input";
    nameInput.placeholder = "Device name";
    nameInput.setAttribute("aria-label", "Device name");

    const categorySelect = document.createElement("select");
    categorySelect.className = "cv-input";
    categorySelect.setAttribute("aria-label", "Device category");
    [
      ["personal", "Personal"],
      ["work", "Work"],
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      categorySelect.appendChild(option);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "cv-button";
    addButton.textContent = "Add device";

    function loadList() {
      fetch(`${window.API_BASE_URL}/admin/pc-tokens`, {
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((devices) => {
          list.replaceChildren();
          if (devices.length === 0) {
            const empty = document.createElement("p");
            empty.className = "connection-account-line";
            empty.textContent = "No devices yet.";
            list.append(empty);
            return;
          }
          devices.forEach((device) => {
            list.append(renderDeviceItem(device, loadList));
          });
        })
        .catch(() => {});
    }

    addButton.addEventListener("click", () => {
      const name = nameInput.value.trim();
      if (!name) return;
      addButton.disabled = true;
      addButton.textContent = "Adding…";
      fetch(`${window.API_BASE_URL}/admin/pc-tokens`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: categorySelect.value }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((result) => {
          nameInput.value = "";
          addButton.disabled = false;
          addButton.textContent = "Add device";
          renderNewDeviceToken(tokenReveal, result);
          loadList();
        })
        .catch(() => {
          addButton.disabled = false;
          addButton.textContent = "Add failed, retry";
        });
    });

    const actionsRow = document.createElement("div");
    actionsRow.className = "connection-actions";
    actionsRow.append(nameInput, categorySelect, addButton);

    section.append(heading, list, tokenReveal, actionsRow);
    loadList();
  }

  function renderSignedIn(email) {
    container.replaceChildren();
    document.getElementById("admin-tabs")?.removeAttribute("hidden");

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

    const discordSection = document.createElement("div");
    discordSection.className = "connection-section";

    const devicesSection = document.createElement("div");
    devicesSection.className = "connection-section";

    container.append(
      p,
      button,
      xboxSection,
      spotifySection,
      steamSection,
      psnSection,
      discordSection,
      devicesSection,
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
    renderDiscordSection(discordSection);
    renderDevicesSection(devicesSection);
  }

  function renderSignedOut(error) {
    const message =
      ERROR_MESSAGES[error] || "Nothing to see here unless you're me.";
    container.replaceChildren();
    document.getElementById("admin-tabs")?.setAttribute("hidden", "");

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
