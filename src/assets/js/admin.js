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

    container.append(p, button);

    button.addEventListener("click", () => {
      fetch(`${window.API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).finally(() => renderSignedOut());
    });
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
