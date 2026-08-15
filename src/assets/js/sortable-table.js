// Adds column sorting and a search box to markdown-generated tables
(function () {
  function collator() {
    return new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  }

  function cellValue(row, index) {
    const cell = row.children[index];
    return cell ? cell.textContent.trim() : "";
  }

  function sortRows(tbody, rows, index, direction) {
    const compare = collator().compare;
    const sorted = rows.slice().sort((a, b) => {
      const result = compare(cellValue(a, index), cellValue(b, index));
      return direction === "asc" ? result : -result;
    });
    sorted.forEach((row) => tbody.appendChild(row));
  }

  function makeSortable(table) {
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    if (!thead || !tbody) return;
    const headers = Array.from(thead.querySelectorAll("th"));
    const rows = Array.from(tbody.querySelectorAll("tr"));

    headers.forEach((th, index) => {
      th.classList.add("sortable");
      th.tabIndex = 0;
      th.setAttribute("role", "button");
      th.setAttribute("aria-sort", "none");

      const activate = () => {
        const current = th.getAttribute("aria-sort");
        const direction = current === "asc" ? "desc" : "asc";
        headers.forEach((other) => other.setAttribute("aria-sort", "none"));
        th.setAttribute("aria-sort", direction);
        sortRows(tbody, rows, index, direction);
      };

      th.addEventListener("click", activate);
      th.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  function makeSearchable(table, wrap) {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const search = document.createElement("input");
    search.type = "search";
    search.className = "table-search";
    search.placeholder = "Search table…";
    search.setAttribute("aria-label", "Search table");

    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      rows.forEach((row) => {
        const matches = !query || row.textContent.toLowerCase().includes(query);
        row.hidden = !matches;
      });
    });

    wrap.parentNode.insertBefore(search, wrap);
  }

  function enhanceTables() {
    document.querySelectorAll(".content .table-wrap").forEach((wrap) => {
      const table = wrap.querySelector("table");
      if (!table || table.dataset.enhanced) return;
      table.dataset.enhanced = "true";
      makeSearchable(table, wrap);
      makeSortable(table);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceTables);
  } else {
    enhanceTables();
  }
})();
