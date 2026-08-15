// Adds a card/list toggle, column sorting, and a search box to markdown-generated tables
(function () {
  function collator() {
    return new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  }

  function cellValue(row, index) {
    const cell = row.children[index];
    return cell ? cell.textContent.trim() : "";
  }

  function cloneCellContents(cell, into) {
    Array.from(cell.childNodes).forEach((node) =>
      into.appendChild(node.cloneNode(true)),
    );
  }

  function buildCard(cells) {
    const card = document.createElement("div");
    card.className = "table-card";

    const imageIndex = cells.findIndex((cell) => cell.querySelector("img"));
    const textIndices = cells.map((_, i) => i).filter((i) => i !== imageIndex);
    const [titleIndex, subtitleIndex, ...metaIndices] = textIndices;

    if (imageIndex !== -1) {
      const media = document.createElement("div");
      media.className = "table-card-media";
      cloneCellContents(cells[imageIndex], media);
      card.appendChild(media);
    }

    const body = document.createElement("div");
    body.className = "table-card-body";

    if (titleIndex !== undefined) {
      const title = document.createElement("h3");
      title.className = "table-card-title";
      cloneCellContents(cells[titleIndex], title);
      body.appendChild(title);
    }

    if (subtitleIndex !== undefined) {
      const subtitle = document.createElement("p");
      subtitle.className = "table-card-subtitle";
      cloneCellContents(cells[subtitleIndex], subtitle);
      body.appendChild(subtitle);
    }

    const metaValues = metaIndices
      .map((i) => cells[i].textContent.trim())
      .filter((value) => value && value !== "—");
    if (metaValues.length) {
      const meta = document.createElement("div");
      meta.className = "table-card-meta";
      metaValues.forEach((value) => {
        const span = document.createElement("span");
        span.textContent = value;
        meta.appendChild(span);
      });
      body.appendChild(meta);
    }

    card.appendChild(body);
    return card;
  }

  function buildCardGrid(rows) {
    const grid = document.createElement("div");
    grid.className = "table-cards";
    const rowCardMap = new Map();
    rows.forEach((row) => {
      const card = buildCard(Array.from(row.children));
      rowCardMap.set(row, card);
      grid.appendChild(card);
    });
    return { grid, rowCardMap };
  }

  function syncCardOrder(tbody, grid, rowCardMap) {
    Array.from(tbody.children).forEach((row) => {
      const card = rowCardMap.get(row);
      if (card) grid.appendChild(card);
    });
  }

  function makeSortable(table, onSort) {
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

        const compare = collator().compare;
        const sorted = rows.slice().sort((a, b) => {
          const result = compare(cellValue(a, index), cellValue(b, index));
          return direction === "asc" ? result : -result;
        });
        sorted.forEach((row) => tbody.appendChild(row));
        onSort();
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

  function makeSearchable(rows, rowCardMap) {
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
        const card = rowCardMap.get(row);
        if (card) card.hidden = !matches;
      });
    });

    return search;
  }

  const VIEW_ICONS = {
    cards:
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    list: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
  };

  function makeViewToggle(table, cardGrid) {
    const toggle = document.createElement("div");
    toggle.className = "view-toggle";
    toggle.setAttribute("role", "group");
    toggle.setAttribute("aria-label", "View");

    const views = [
      { key: "cards", label: "Card view", el: cardGrid },
      { key: "list", label: "List view", el: table.closest(".table-wrap") },
    ];

    const buttons = views.map(({ key, label }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "view-toggle-btn";
      button.innerHTML = VIEW_ICONS[key];
      button.dataset.view = key;
      button.title = label;
      button.setAttribute("aria-label", label);
      toggle.appendChild(button);
      return button;
    });

    const setView = (activeKey) => {
      views.forEach(({ key, el }) => {
        el.hidden = key !== activeKey;
      });
      buttons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.view === activeKey),
        );
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    setView("cards");
    return toggle;
  }

  function enhanceTables() {
    document.querySelectorAll(".content .table-wrap").forEach((wrap) => {
      const table = wrap.querySelector("table");
      const tbody = table && table.querySelector("tbody");
      if (!table || !tbody || table.dataset.enhanced) return;
      table.dataset.enhanced = "true";

      const rows = Array.from(tbody.querySelectorAll("tr"));
      const { grid: cardGrid, rowCardMap } = buildCardGrid(rows);

      const controls = document.createElement("div");
      controls.className = "table-controls";
      controls.appendChild(makeSearchable(rows, rowCardMap));
      controls.appendChild(makeViewToggle(table, cardGrid));

      wrap.parentNode.insertBefore(controls, wrap);
      wrap.parentNode.insertBefore(cardGrid, wrap);

      makeSortable(table, () => syncCardOrder(tbody, cardGrid, rowCardMap));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceTables);
  } else {
    enhanceTables();
  }
})();
