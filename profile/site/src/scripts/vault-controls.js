// Read-only view controls over the server-rendered Vault grid: filter by
// kind, sort by year/recent. No fetch, no mutation — just reordering/hiding
// DOM nodes that are already real (see lib/shelves.ts).
function initVaultControls() {
  const grid = document.getElementById("spec-vault-grid");
  if (!grid) return;
  const items = Array.from(grid.children);
  const countEl = document.getElementById("spec-vault-count");
  const total = items.length;

  let kind = "all";
  let sort = "recent";

  function apply() {
    const visible = items.filter((el) => kind === "all" || el.dataset.kind === kind);

    const sorted = visible.slice().sort((a, b) => {
      if (sort === "year") return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
      return Number(a.dataset.order || 0) - Number(b.dataset.order || 0);
    });

    for (const el of items) el.hidden = true;
    grid.replaceChildren(...sorted);
    for (const el of sorted) el.hidden = false;

    if (countEl) countEl.textContent = `${visible.length} OF ${total} SHOWN`;
  }

  for (const btn of document.querySelectorAll("[data-vault-kind]")) {
    btn.addEventListener("click", () => {
      kind = btn.dataset.vaultKind;
      for (const b of document.querySelectorAll("[data-vault-kind]")) {
        b.classList.toggle("spec-chip-active", b === btn);
      }
      apply();
    });
  }
  for (const btn of document.querySelectorAll("[data-vault-sort]")) {
    btn.addEventListener("click", () => {
      sort = btn.dataset.vaultSort;
      for (const b of document.querySelectorAll("[data-vault-sort]")) {
        b.classList.toggle("spec-chip-active", b === btn);
      }
      apply();
    });
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initVaultControls);
} else {
  initVaultControls();
}
