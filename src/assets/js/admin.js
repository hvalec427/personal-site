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
    container.innerHTML = `
      <p>Signed in as <strong>${email}</strong></p>
      <button type="button" class="cv-button" id="admin-logout">Log out</button>
    `;
    document.getElementById("admin-logout").addEventListener("click", () => {
      fetch(`${window.API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).finally(() => renderSignedOut());
    });
  }

  function renderSignedOut(error) {
    const message =
      ERROR_MESSAGES[error] || "Nothing to see here unless you're me.";
    container.innerHTML = `
      <p>${message}</p>
      <a href="${window.API_BASE_URL}/auth/google" class="cv-button">Login with Google</a>
    `;
  }

  // The admin token lives in an httpOnly cookie the browser manages on its
  // own — this is the only way to learn whether it's set and valid.
  fetch(`${window.API_BASE_URL}/auth/me`, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((data) => renderSignedIn(data.email))
    .catch(() => renderSignedOut(urlError));
})();
