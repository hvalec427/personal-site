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

  function formatXboxTimestamp(iso) {
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

  // Just connection health for the integration — no game data belongs here,
  // that's what a public widget would be for.
  function renderXboxStatus(section, data) {
    section.replaceChildren();

    const status = document.createElement("p");
    status.className = "xbox-status-line";
    status.append("Xbox: ");
    const strong = document.createElement("strong");
    strong.textContent = data.linked ? "Connected" : "Not connected";
    status.appendChild(strong);

    const fetched = document.createElement("p");
    fetched.className = "xbox-status-date";
    fetched.textContent = data.linkedAt
      ? `Last fetched: ${formatXboxTimestamp(data.linkedAt)}`
      : "Last fetched: never";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cv-button";
    button.textContent = "Fetch now";

    button.addEventListener("click", () => {
      button.disabled = true;
      button.textContent = "Fetching…";
      fetch(`${window.API_BASE_URL}/auth/xbox`, {
        method: "POST",
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((updated) => renderXboxStatus(section, updated))
        .catch(() => {
          button.disabled = false;
          button.textContent = "Fetch failed, retry";
        });
    });

    section.append(status, fetched, button);
  }

  function renderXboxSection(section) {
    fetch(`${window.API_BASE_URL}/auth/xbox/status`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => renderXboxStatus(section, data))
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
    xboxSection.className = "xbox-section";

    container.append(p, button, xboxSection);

    button.addEventListener("click", () => {
      fetch(`${window.API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).finally(() => renderSignedOut());
    });

    renderXboxSection(xboxSection);
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

  // The admin token lives in an httpOnly cookie the browser manages on its
  // own — this is the only way to learn whether it's set and valid.
  fetch(`${window.API_BASE_URL}/auth/me`, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((data) => renderSignedIn(data.email))
    .catch(() => renderSignedOut(urlError));
})();
