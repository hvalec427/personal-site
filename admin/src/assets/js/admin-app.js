// Generic, schema-driven admin engine — mirrors hvalec-api's generic
// /admin/entities/:kind CRUD (see routes/admin-entities.js) the same way
// the Admin.dc.html design's own PANELS array drives one reusable table
// editor instead of a bespoke UI per entity. Add a panel by adding one
// entry to PANELS below; no new markup needed for the common case.

// Matches the design's METRICS list — free-text metric_key suggestions for
// automatic habits, not an enum (any string is a valid metric_key).
const METRICS = [
  "pages read",
  "sessions",
  "km moved",
  "climb",
  "episodes watched",
  "films watched",
  "games played",
  "hours played",
  "tracks played",
  "photos kept",
];

const PANELS = [
  // ---- Profile: static copy ----
  {
    id: "identity",
    group: "Profile",
    label: "Identity",
    kicker: "WHO THIS IS",
    blurb: "The header block on the profile page.",
    kind: "settings:identity",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "dob", label: "Date of birth", type: "date" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "photoAssetId", label: "Photo", type: "cover", assetKind: "other" },
      { key: "photoCaption", label: "Photo caption", type: "text" },
    ],
  },
  {
    id: "status",
    group: "Profile",
    label: "Status",
    kicker: "BROADCAST STATE",
    blurb: "A manual note — the public page currently derives its status from live presence instead, so this is admin-only for now.",
    kind: "status",
  },
  {
    id: "work",
    group: "Profile",
    label: "Experience",
    kicker: "WORK HISTORY",
    blurb: "Roles, newest first. Leave \"To\" blank for the current job.",
    kind: "work",
    columns: ["role", "company", "fromDate"],
    fields: [
      { key: "role", label: "Role", type: "text" },
      { key: "company", label: "Company", type: "text" },
      { key: "fromDate", label: "From", type: "text", placeholder: "YYYY-MM" },
      { key: "toDate", label: "To", type: "text", placeholder: "YYYY-MM" },
      { key: "location", label: "Location", type: "text" },
      { key: "summary", label: "Summary", type: "longtext" },
      { key: "tags", label: "Tags", type: "text", placeholder: "comma-separated" },
    ],
  },
  {
    id: "education",
    group: "Profile",
    label: "Education",
    kicker: "SCHOOLING",
    blurb: "Schools and degrees, newest first.",
    kind: "education",
    columns: ["title", "school", "fromDate"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "school", label: "School", type: "text" },
      { key: "fromDate", label: "From", type: "text" },
      { key: "toDate", label: "To", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "note", label: "Note", type: "longtext" },
    ],
  },
  {
    id: "projects",
    group: "Profile",
    label: "Projects",
    kicker: "THINGS BUILT",
    blurb: "Shipped, in progress, or abandoned with dignity.",
    kind: "projects",
    columns: ["name", "description"],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "text" },
      { key: "tags", label: "Tags", type: "text", placeholder: "comma-separated" },
      { key: "links", label: "Links", type: "links" },
      { key: "longDescription", label: "Long description", type: "longtext" },
    ],
  },
  {
    id: "elsewhere",
    group: "Profile",
    label: "Elsewhere",
    kicker: "OUTBOUND",
    blurb: "Every profile you'd admit to.",
    kind: "elsewhere",
    columns: ["category", "site", "handle"],
    fields: [
      { key: "category", label: "Category", type: "select", options: ["CODE", "MUSIC", "FILM", "BOOKS", "GAMES", "WORK", "POSTS", "MAIL", "FEED", "SOCIAL"] },
      { key: "site", label: "Site", type: "text" },
      { key: "handle", label: "Handle", type: "text" },
      { key: "url", label: "URL", type: "text" },
    ],
  },

  // ---- Writing ----
  {
    id: "blog",
    group: "Writing",
    label: "Blog",
    kicker: "WRITING",
    blurb: "Posts and drafts, written in markdown with a live preview. Images upload to R2.",
    kind: "blog",
  },
  {
    id: "logs",
    group: "Writing",
    label: "Logs",
    kicker: "DAILY SNIPPETS",
    blurb: "Short daily thoughts and random notes, in markdown. Newest first.",
    kind: "logs",
    columns: ["created", "title"],
    fields: [
      { key: "created", label: "Date", type: "date", placeholder: "YYYY-MM-DD" },
      { key: "title", label: "Title", type: "text", placeholder: "optional — else numbered" },
      { key: "body", label: "Body", type: "longtext" },
    ],
  },

  // ---- Tracking: logged over time ----
  {
    id: "habits",
    group: "Tracking",
    label: "Habits",
    kicker: "MAINTENANCE LOG",
    blurb: "Mark today's habits by hand, and add, rename, or remove the habits themselves below.",
    kind: "habits",
    columns: ["name", "target", "kind"],
    fields: [
      { key: "name", label: "Habit", type: "text" },
      { key: "target", label: "Target", type: "text", placeholder: "e.g. daily, 5×/week" },
      { key: "kind", label: "Kind", type: "enum", options: ["manual", "automatic"] },
      { key: "metricKey", label: "Metric", type: "list", options: METRICS, onlyWhen: ["kind", "automatic"] },
      { key: "op", label: "Op", type: "enum", options: ["at-least", "at-most", "exactly", "any", "none"], onlyWhen: ["kind", "automatic"] },
      { key: "value", label: "Value", type: "number", onlyWhen: ["kind", "automatic"] },
      { key: "window", label: "Window", type: "enum", options: ["day", "week"], onlyWhen: ["kind", "automatic"] },
    ],
  },
  {
    id: "motion",
    group: "Tracking",
    label: "Exercise",
    kicker: "LEGS, VOLUNTARILY",
    blurb: "Each entry also logs a \"km moved\" metric event for automatic habits.",
    kind: "motion",
    recent: true,
    columns: ["date", "type", "route"],
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "type", label: "Type", type: "enum", options: ["JOG", "HIKE", "RIDE", "SKI"] },
      { key: "route", label: "Route", type: "text" },
      { key: "note", label: "Note", type: "text" },
      { key: "distanceKm", label: "Distance (km)", type: "number" },
      { key: "distance", label: "Distance (display)", type: "text", placeholder: "10.4 km" },
      { key: "climb", label: "Climb", type: "text", placeholder: "62 m" },
      { key: "duration", label: "Time", type: "text", placeholder: "52:10" },
      { key: "pace", label: "Pace", type: "text" },
    ],
  },
  {
    id: "screen",
    group: "Tracking",
    label: "TV & film",
    kicker: "FILM & TV",
    blurb: "Recently watched, plus shows still in progress.",
    kind: "screen",
    searchKind: "movies",
    hideList: true, // the watch log + continue-watching card replace the plain table
    columns: ["title", "year", "status"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "type", label: "Type", type: "enum", options: ["Movie", "TV Show"] },
      { key: "status", label: "Status", type: "enum", options: ["Watching", "Watched", "Abandoned"] },
      { key: "season", label: "Season", type: "number", onlyWhen: ["type", "TV Show"] },
      { key: "episode", label: "Episode", type: "number", onlyWhen: ["type", "TV Show"] },
      { key: "rating", label: "Rating", type: "enum", options: ["★", "★★", "★★★", "★★★★", "★★★★★"], onlyWhen: ["status", ["Watched", "Abandoned"]] },
    ],
    searchMap: (r) => ({ title: r.title, year: r.year, type: r.type || "Movie", tmdbId: r.sourceId }),
  },
  {
    id: "paper",
    group: "Tracking",
    label: "Books",
    kicker: "READING LOG",
    blurb: "Recently read. Updating \"On page\" also logs a pages-read metric event.",
    kind: "paper",
    searchKind: "books",
    hideList: true, // Continue Reading + Reading Log replace the plain table
    columns: ["title", "author", "status"],
    fields: [
      // `lockable`: read-only when the entry was picked from the Vault (owned) —
      // those catalogue details come from the vault record. Other sources /
      // manual entry stay editable. See fieldLocked() + useResult().
      { key: "title", label: "Title", type: "text", lockable: true },
      { key: "author", label: "Author", type: "text", lockable: true },
      { key: "pages", label: "Pages", type: "number", lockable: true },
      { key: "status", label: "Status", type: "enum", options: ["Reading", "Read", "Abandoned"] },
      { key: "onPage", label: "On page", type: "number" },
      { key: "rating", label: "Rating", type: "enum", options: ["★", "★★", "★★★", "★★★★", "★★★★★"], onlyWhen: ["status", ["Read", "Abandoned"]] },
      { key: "verdict", label: "Verdict", type: "longtext" },
    ],
    // Link to the Vault book when picked from there, so catalogue data is read
    // through the link (not duplicated). searchMap still stores title/etc. as a
    // fallback (title is NOT NULL), but the server overrides them from the vault.
    searchMap: (r) => ({
      title: r.title,
      author: r.author,
      pages: r.pages,
      vaultBookId: r._provider === "vault" ? r.id : null,
    }),
  },
  {
    id: "play",
    group: "Tracking",
    label: "Gaming",
    kicker: "DERIVED — NOT EDITABLE",
    blurb: "Recently played comes from Xbox/PlayStation/Steam.",
    kind: "derived:play",
    sources: "XBOX · PLAYSTATION · STEAM",
    detail: "Recently played and the sidebar's Playing slot follow the newest session from the connected accounts.",
    footer: "READ-ONLY · DISCS AND KEYS YOU OWN LIVE IN VAULT / GAMES",
  },
  {
    id: "music",
    group: "Tracking",
    label: "Music",
    kicker: "DERIVED — NOT EDITABLE",
    blurb: "Latest listening comes from Spotify.",
    kind: "derived:music",
    sources: "SPOTIFY",
    detail: "The latest track and the sidebar's Listening slot follow the newest play from Spotify.",
    footer: "READ-ONLY · RECORDS AND CDS YOU OWN LIVE IN VAULT / MUSIC",
  },
  {
    id: "places",
    group: "Tracking",
    label: "Places",
    kicker: "TRIPS & COUNTRIES",
    blurb: "One row per trip.",
    kind: "places",
    columns: ["city", "country", "fromDate"],
    fields: [
      { key: "fromDate", label: "From", type: "date" },
      { key: "toDate", label: "To", type: "date" },
      { key: "city", label: "City", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "withWhom", label: "With", type: "text" },
    ],
  },
  {
    id: "photos",
    group: "Tracking",
    label: "Photos",
    kicker: "CONTACT SHEET",
    blurb: "The keepers — profile page gallery.",
    kind: "photos",
    fixed: { subject: "profile" },
    filter: (r) => r.subject === "profile",
    columns: ["caption"],
    fields: [
      { key: "assetId", label: "Image", type: "cover", assetKind: "other" },
      { key: "caption", label: "Caption", type: "text" },
    ],
  },

  // ---- Dog: subject 002 ----
  {
    id: "dog",
    group: "Dog",
    label: "Details",
    kicker: "SUBJECT 002",
    blurb: "The header block on the dog page.",
    kind: "settings:dog",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "birthDate", label: "Birth date", type: "date" },
      { key: "breed", label: "Breed", type: "text" },
      { key: "photoAssetId", label: "Photo", type: "cover", assetKind: "dog" },
      { key: "photoCaption", label: "Photo caption", type: "text" },
      { key: "status", label: "Status", type: "text" },
    ],
  },
  {
    id: "dog-weight",
    group: "Dog",
    label: "Weight",
    kicker: "KITCHEN SCALE",
    blurb: "One weigh-in per row.",
    kind: "dog-weight",
    columns: ["date", "weight"],
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "weight", label: "Weight (kg)", type: "number" },
      { key: "note", label: "Note", type: "text" },
    ],
  },
  {
    id: "dog-vet",
    group: "Dog",
    label: "Vet visits",
    kicker: "CLINIC LOG",
    blurb: "One visit per row — tracked over time.",
    kind: "dog-vet",
    columns: ["date", "reason"],
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "reason", label: "Reason", type: "text", placeholder: "e.g. checkup, vaccination" },
      { key: "note", label: "Note", type: "text" },
    ],
  },
  {
    id: "dog-tricks",
    group: "Dog",
    label: "Tricks",
    kicker: "REPERTOIRE",
    blurb: "What the dog can do, and how reliably.",
    kind: "dog-tricks",
    columns: ["trick", "learned", "reliability"],
    fields: [
      { key: "trick", label: "Trick", type: "text" },
      { key: "learned", label: "Learned", type: "text" },
      { key: "reliability", label: "Reliability %", type: "number" },
      { key: "caveat", label: "Caveat", type: "text" },
    ],
  },
  {
    id: "dog-awards",
    group: "Dog",
    label: "Achievements",
    kicker: "SELF-AWARDED",
    blurb: "Unlocked or still pending.",
    kind: "dog-awards",
    columns: ["title", "status"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "when", label: "When", type: "text" },
      { key: "note", label: "Note", type: "text" },
      { key: "status", label: "Status", type: "enum", options: ["Unlocked", "Locked"] },
    ],
  },
  {
    id: "dog-photos",
    group: "Dog",
    label: "Photos",
    kicker: "CONTACT SHEET",
    blurb: "Frames for the dog page.",
    kind: "photos",
    fixed: { subject: "dog" },
    filter: (r) => r.subject === "dog",
    columns: ["caption"],
    fields: [
      { key: "assetId", label: "Image", type: "cover", assetKind: "dog" },
      { key: "caption", label: "Caption", type: "text" },
    ],
  },

  // ---- Vault: things owned ----
  {
    id: "vault-games",
    group: "Vault",
    label: "Games",
    kicker: "VAULT / GAMES",
    blurb: "Physical copies owned.",
    kind: "vault-games",
    searchKind: "games",
    columns: ["title", "platform", "year"],
    fields: [
      { key: "coverAssetId", label: "Cover", type: "cover", assetKind: "game" },
      { key: "title", label: "Title", type: "text" },
      { key: "platform", label: "Platform", type: "text" },
      { key: "genre", label: "Genre", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "status", label: "Status", type: "enum", options: ["Unplayed", "Playing", "Finished", "Abandoned"] },
    ],
    searchMap: (r) => ({ title: r.title }),
  },
  {
    id: "vault-books",
    group: "Vault",
    label: "Books",
    kicker: "VAULT / BOOKS",
    blurb: "A catalogue of the books owned.",
    kind: "vault-books",
    searchKind: "books",
    columns: ["title", "author", "origYear"],
    fields: [
      { key: "coverAssetId", label: "Cover", type: "cover", assetKind: "book" },
      { key: "title", label: "Title", type: "text" },
      { key: "author", label: "Author", type: "text" },
      { key: "originalTitle", label: "Original title", type: "text" },
      { key: "origYear", label: "Orig. year", type: "text" },
      { key: "pages", label: "Pages", type: "number" },
      { key: "format", label: "Format", type: "enum", options: ["Physical", "Digital"] },
      { key: "editionNotes", label: "Edition notes", type: "text" },
    ],
    searchMap: (r) => ({ title: r.title, author: r.author, origYear: r.year, pages: r.pages }),
  },
  {
    id: "vault-music",
    group: "Vault",
    label: "Music",
    kicker: "VAULT / MUSIC",
    blurb: "Vinyl and CDs owned.",
    kind: "vault-music",
    searchKind: "music",
    columns: ["title", "artist", "year"],
    fields: [
      { key: "coverAssetId", label: "Cover", type: "cover", assetKind: "music" },
      { key: "title", label: "Title", type: "text" },
      { key: "artist", label: "Artist", type: "text" },
      { key: "genre", label: "Genre", type: "text" },
      { key: "format", label: "Format", type: "enum", options: ["Vinyl", "CD"] },
      { key: "year", label: "Year", type: "text" },
    ],
    searchMap: (r) => ({ title: r.title, artist: r.artist, year: r.year }),
  },
  {
    id: "vault-movies",
    group: "Vault",
    label: "Films",
    kicker: "VAULT / FILMS",
    blurb: "Films and shows owned.",
    kind: "vault-movies",
    searchKind: "movies",
    columns: ["title", "year", "genre"],
    fields: [
      { key: "coverAssetId", label: "Cover", type: "cover", assetKind: "movie" },
      { key: "title", label: "Title", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "genre", label: "Genre", type: "text" },
      { key: "format", label: "Format", type: "enum", options: ["Physical", "Digital"] },
    ],
    searchMap: (r) => ({ title: r.title, year: r.year }),
  },

  // ---- Media ----
  { id: "assets", group: "Media", label: "Photos", kicker: "MEDIA / IMAGE LIBRARY", blurb: "Any image — uploaded once, then pointed at from anywhere.", kind: "assets" },
];

// Each group carries the design's small mono note shown to the right of the
// section label in the sidebar.
const GROUPS = [
  { label: "Profile", note: "static copy" },
  { label: "Writing", note: "blog & logs" },
  { label: "Tracking", note: "logged over time" },
  { label: "Dog", note: "subject 002" },
  { label: "Vault", note: "things owned" },
  { label: "Media", note: "images" },
];

document.addEventListener("alpine:init", () => {
  Alpine.data("adminApp", () => ({
    panels: PANELS,
    groups: GROUPS,
    activeId: "identity",
    rows: [],
    counts: {},
    // The Connections/Services panel is rendered by admin.js (not the generic
    // engine), so its count is the fixed set of integrations it draws:
    // Xbox, Spotify, Steam, PSN, Discord. Keep in sync with renderSignedIn().
    servicesCount: 5,
    screenEvents: [], // per-episode watch history for the TV & film panel
    readingEvents: [], // per-update page history for the books panel
    // TV/film details popup (TMDB-backed): a movie shows straight details, a
    // show adds a season picker → episode list → per-episode details.
    detailOpen: false,
    detailLoading: false,
    detailError: "",
    detail: null, // loaded movie/show { kind, title, overview, runtimeMin, rating, cast, seasons? }
    detailRow: null, // source row/event the popup was opened from
    detailSeason: null, // selected season number (TV)
    detailSeasonData: null, // { episodes: [...] } for the selected season
    detailSeasonLoading: false,
    detailEpisode: null, // episode number currently expanded, if any
    detailEpisodeObj: null, // the expanded/focused episode object
    detailFocus: "show", // "show" (movie/show overview) | "episode" (one episode)
    loading: false,
    error: "",
    buildTime: (typeof window !== "undefined" && window.ADMIN_BUILD_TIME) || "",

    // modal (create/edit) state
    modalOpen: false,
    modalMode: "create",
    editingId: null,
    editingField: null,
    saveError: "",
    formData: {},
    linkRows: [],
    pickerOpen: false,
    pickerQuery: "",

    // delete confirm
    deleteId: null,

    // search/lookup
    query: "",
    searchResults: [],
    searching: false,
    searchError: "",

    // habits
    habits: [],

    // status
    statusOptions: [
      { label: "Automatic", hint: "follows whatever the services say — gaming, watching, listening", auto: true },
      { label: "Fine", hint: "the default lie" },
      { label: "Heads down", hint: "working, back later" },
      { label: "Feral", hint: "no notes" },
      { label: "Reading", hint: "do not interrupt" },
      { label: "Away", hint: "offline on purpose" },
      { label: "Buffering", hint: "back shortly" },
    ],
    currentStatus: null,

    // derived (play/music) — history feeds recorded by the API pollers
    presence: [],
    readingNow: [],
    playHistory: [],
    musicHistory: [],
    topArtists: [],

    // assets library
    assets: [],
    assetUploading: false,

    // blog
    blogPosts: [],
    blogDraft: null, // null = list view; object = editing that post
    blogHtml: "", // rendered markdown preview (Alpine CSP x-html needs a property, not a method call)
    blogSaving: false,
    blogImageUploading: false,
    blogDeleteId: null,
    blogImageModal: false,
    blogImageMode: "choice", // 'choice' | 'gallery'
    blogImageSize: ".log-image", // kramdown class(es) appended to inserted images
    blogImageSizes: [
      { v: ".log-image", l: "Full" },
      { v: ".log-image .large", l: "Large" },
      { v: ".log-image .medium", l: "Medium" },
      { v: ".log-image .small", l: "Small" },
      { v: ".log-image .very-small", l: "Very small" },
      { v: "", l: "Plain" },
    ],
    blogPickerQuery: "",
    blogLinkModal: false,
    blogLinkText: "",
    blogLinkUrl: "",
    blogLinkNewTab: false,
    blogKramdownModal: false,
    // Kramdown block classes the site's CSS supports (applied to the element
    // on the line above where you drop them).
    blogKramdown: [
      { label: "Section head", snippet: "{: .section-head}", desc: "styles the heading above it" },
      { label: "Photo gallery", snippet: "{: .photo-gallery}", desc: "lays the images above out as a gallery" },
      { label: "Profile photo", snippet: "{: .profile-photo}", desc: "rounded, centered portrait" },
      { label: "Entry date", snippet: "{: .entry-when}", desc: "muted date/timestamp line" },
    ],

    get active() {
      return this.panels.find((p) => p.id === this.activeId);
    },

    // Local HH:MM:SS of this build — shown in the header so it's obvious at a
    // glance whether the page in front of you is the latest deploy.
    buildLabel() {
      if (!this.buildTime) return "";
      const d = new Date(this.buildTime);
      const p = (n) => String(n).padStart(2, "0");
      return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    },

    panelsIn(group) {
      return this.panels.filter((p) => p.group === group);
    },

    // Panels that hold no list (single-record settings, derived feeds, the
    // manual status note) never carry a count.
    countable(panel) {
      const k = String(panel.kind);
      return !(k.startsWith("settings:") || k.startsWith("derived:") || k === "status");
    },

    countFor(panel) {
      if (!this.countable(panel)) return "";
      // The active panel shows its live, possibly-just-edited data; every other
      // panel reads the cache filled by loadCounts() so the number is always
      // visible, not only once you open the tab.
      if (panel.id === this.activeId) {
        if (panel.kind === "assets") return this.assets.length;
        if (panel.kind === "blog") return this.blogPosts.length;
        return this.visibleRows.length;
      }
      const c = this.counts[panel.id];
      return c === undefined ? "" : c;
    },

    // Fetch every list-backed panel's size up front so the sidebar can show
    // counts for all tabs at once. Distinct data sources are fetched once and
    // reused (e.g. the two "photos" panels share one /entities/photos call),
    // then each panel's own filter is applied.
    async loadCounts() {
      const cache = {};
      const source = (panel) => {
        const k = String(panel.kind);
        if (k === "habits") return "/habits";
        if (k === "assets") return "/admin/assets";
        return `/admin/entities/${k}`;
      };
      const fetchRows = (path) => {
        if (!cache[path]) cache[path] = this.api(path).catch(() => []);
        return cache[path];
      };
      const next = {};
      await Promise.all(
        this.panels.filter((p) => this.countable(p)).map(async (panel) => {
          let rows = await fetchRows(source(panel));
          if (!Array.isArray(rows)) rows = [];
          if (panel.filter) rows = rows.filter(panel.filter);
          next[panel.id] = rows.length;
        }),
      );
      this.counts = next;
    },

    get visibleRows() {
      const source = this.active?.kind === "habits" ? this.habits : this.rows;
      if (!this.active?.filter) return source;
      return source.filter(this.active.filter);
    },

    // Recent-activity feed (panels flagged recent: true) — the last entries by
    // updatedAt, newest first, like the music/gaming history feeds.
    get recentRows() {
      return [...this.visibleRows]
        .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
        .slice(0, 8);
    },

    // Panels backed by a collection of covers (vault-*, photos) carry a cover
    // field — when present the list gets a leading thumbnail column.
    get coverField() {
      return (this.active?.fields || []).find((f) => f.type === "cover") || null;
    },
    listGrid() {
      const n = (this.active?.columns || []).length;
      return `${this.coverField ? "52px " : ""}repeat(${n},1fr) 40px 40px`;
    },

    async api(path, opts = {}) {
      const res = await fetch(`${window.API_BASE_URL}${path}`, {
        credentials: "include",
        headers: opts.body ? { "Content-Type": "application/json" } : undefined,
        ...opts,
      });
      if (!res.ok) throw new Error(`${opts.method || "GET"} ${path} -> ${res.status}`);
      if (res.status === 204) return null;
      return res.json();
    },

    async selectPanel(id) {
      this.activeId = id;
      this.error = "";
      try {
        localStorage.setItem("admin-active-panel", id);
      } catch {}
      await this.loadActive();
      this.loadCounts(); // refresh other tabs' counts (edits here can affect them, e.g. shared photos)
    },

    // "Connections" isn't in PANELS (it's the pre-existing OAuth UI, not a
    // generic entity panel), so it needs its own setter to still persist —
    // selectPanel() calls loadActive(), which has nothing to do for it.
    selectConnections() {
      this.activeId = "connections";
      try {
        localStorage.setItem("admin-active-panel", "connections");
      } catch {}
      this.loadCounts();
    },

    async loadActive() {
      const panel = this.active;
      if (!panel) return;
      this.loading = true;
      try {
        if (panel.kind === "habits") {
          this.habits = await this.api("/habits");
        } else if (panel.kind === "status") {
          this.currentStatus = await this.api("/admin/status");
        } else if (panel.kind === "assets") {
          this.assets = await this.api("/admin/assets");
        } else if (panel.kind === "blog") {
          this.blogDraft = null;
          await this.loadBlog();
        } else if (panel.kind.startsWith("settings:")) {
          const key = panel.kind.split(":")[1];
          this.formData = (await this.api(`/admin/settings/${key}`)) || {};
        } else if (panel.kind === "derived:currently" || panel.kind === "derived:play" || panel.kind === "derived:music") {
          await this.loadDerived(panel.kind);
        } else {
          this.rows = await this.api(`/admin/entities/${panel.kind}`);
        }
        if (panel.kind === "screen") await this.loadScreenEvents();
        if (panel.kind === "paper") await this.loadReadingEvents();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async loadDerived(kind) {
      // Both panels now show the recorded history ledger (written by the API
      // pollers into play_log / music_derived), newest first.
      if (kind === "derived:music") {
        this.musicHistory = await this.api("/admin/music-history?limit=30").catch(() => []);
        this.topArtists = await this.api("/admin/top-artists").catch(() => []);
      } else if (kind === "derived:play") {
        this.playHistory = await this.api("/admin/play-history?limit=30").catch(() => []);
      }
    },

    // play_log.hours is our own measured session duration (see history.js),
    // shown in the gaming feed when a session has ended.
    fmtHours(h) {
      const n = Number(h);
      if (!(n > 0)) return "";
      return `${Math.round(n * 10) / 10} HRS`;
    },

    // Compact relative time for the history feeds ("3M AGO", "2H AGO", "SEP 3").
    histWhen(iso) {
      if (!iso) return "";
      const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
      if (secs < 60) return "NOW";
      const mins = Math.floor(secs / 60);
      if (mins < 60) return `${mins}M AGO`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}H AGO`;
      const days = Math.floor(hours / 24);
      if (days === 1) return "YESTERDAY";
      if (days < 7) return `${days}D AGO`;
      const d = new Date(iso);
      const mon = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return `${mon[d.getMonth()]} ${d.getDate()}`;
    },

    presenceBySource(source) {
      return this.presence.find((s) => s.source === source && s.presence !== "offline");
    },
    playingEntry() {
      return this.presenceBySource("xbox") || this.presenceBySource("steam") || this.presenceBySource("psn");
    },

    // ---------- status ----------
    // Saves immediately on click — no separate Save step. (Unlike the
    // edit popups elsewhere, which do wait for an explicit Save.)
    async pickStatus(opt) {
      this.currentStatus = await this.api("/admin/status", {
        method: "POST",
        body: JSON.stringify({ label: opt.label, isAutomatic: Boolean(opt.auto) }),
      });
    },

    // ---------- habits ----------
    get manualHabits() {
      return this.habits.filter((h) => h.kind !== "automatic");
    },
    get automaticHabits() {
      return this.habits.filter((h) => h.kind === "automatic");
    },
    doneToday(habit) {
      return habit.days?.at(-1)?.done ?? false;
    },
    // Preview widget only shows the last 7 of the 28 days the API returns.
    last7(habit) {
      return (habit.days || []).slice(-7);
    },
    habitRate(habit) {
      return `${this.last7(habit).filter((d) => d.done).length} / 7 DAYS`;
    },
    habitDayLabel(day) {
      if (day.date === new Date().toISOString().slice(0, 10)) return "TODAY";
      const dt = new Date(`${day.date}T12:00:00`);
      return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][dt.getDay()];
    },
    habitRuleLine(habit) {
      if (habit.kind !== "automatic" || !habit.metricKey) return "";
      let phrase;
      if (habit.op === "any") phrase = `any ${habit.metricKey}`;
      else if (habit.op === "none") phrase = `no ${habit.metricKey}`;
      else phrase = `${(habit.op || "at-least").replace("-", " ")} ${habit.value ?? "0"} ${habit.metricKey}`;
      return `${phrase} / ${habit.window || "day"}`.toUpperCase();
    },
    habitMark(habit) {
      const on = this.doneToday(habit);
      if (habit.kind !== "automatic") return on ? "DONE TODAY" : "NOT YET";
      if (!habit.metricKey) return "NEEDS A RULE";
      return (habit.window === "week" ? "THIS WEEK: " : "TODAY: ") + (on ? "PASS" : "NOT YET");
    },
    async toggleHabitDay(habit, date) {
      if (habit.kind === "automatic") return;
      await this.api(`/habits/${habit.id}/log`, { method: "POST", body: JSON.stringify({ date }) });
      this.habits = await this.api("/habits");
    },
    // ---------- continue reading (paper) / watching (screen) ----------
    // Both cards edit the same generic entities the list below them does, so
    // every action here is a normal PUT + reload — no bespoke endpoint. The
    // *stage* maps keep a just-finished row on the card for one more beat so
    // it can be rated, since finishing flips it out of the in-progress filter.
    bookStage: {},
    watchStage: {},
    customOpenId: null,
    // Book popup (opened from Continue Reading / Recent): info, page-progress
    // update, and a link to the matching Vault book.
    bookModalOpen: false, // book INFO popup
    bookModalRow: null,
    bookVaultMatch: null, // matching vault-books row, or null if not owned
    bookVaultChecked: false,
    pageModalOpen: false, // page-update popup (current page only)
    pageModalRow: null,
    pageDraft: 0, // working current-page value in the page popup
    vaultHighlightId: null, // row to highlight after "Go to vault"

    // Quick actions (mark watched/watching, page bumps, ratings) send ONLY the
    // changed fields — the backend's .set() does a partial update. Spreading the
    // whole current row back used to round-trip server-managed columns like the
    // updatedAt timestamp, which the Drizzle update rejects; that error was then
    // swallowed, so the buttons silently did nothing. Surface failures now.
    async updateEntity(id, patch) {
      const kind = this.active.kind;
      try {
        await this.api(`/admin/entities/${kind}/${id}`, {
          method: "PUT",
          body: JSON.stringify(patch),
        });
        this.rows = await this.api(`/admin/entities/${kind}`);
        this.error = "";
        return true;
      } catch (e) {
        this.error = `Couldn't save: ${e.message}`;
        return false;
      }
    },

    get readingRows() {
      return this.rows.filter((r) => r.status === "Reading" || this.bookStage[r.id]);
    },
    readingStageRate(row) {
      return this.bookStage[row.id] === "rate";
    },
    readingProgressLabel(row) {
      const pages = Number(row.pages) || 0;
      const on = Number(row.onPage) || 0;
      return pages ? `PAGE ${on} / ${pages}` : `PAGE ${on}`;
    },
    readingBarStyle(row) {
      const pages = Number(row.pages) || 0;
      const on = Number(row.onPage) || 0;
      const pct = pages ? Math.max(0, Math.min(100, Math.round((on / pages) * 100))) : 0;
      return `height:100%;width:${pct}%;background:#5980a6`;
    },
    // ---------- book INFO popup (details + edit/vault link) ----------
    openBookModal(row) {
      this.bookModalRow = row;
      // The stored link decides the action: Go to vault (owned) vs Edit (manual).
      this.bookVaultMatch = row.vaultBookId ? { id: row.vaultBookId } : null;
      this.bookVaultChecked = true;
      this.bookModalOpen = true;
    },
    closeBookModal() {
      this.bookModalOpen = false;
      this.bookModalRow = null;
    },
    // Open the info popup from a Reading Log entry (looks the book up by id).
    openBookFromEvent(ev) {
      const row = this.rows.find((r) => r.id === ev.readingId);
      if (row) this.openBookModal(row);
    },
    // Manual (non-vault) book: edit its details (incl. page count) via the
    // generic edit modal. Vault books edit their catalogue data in the Vault.
    editBook(row) {
      this.closeBookModal();
      this.openEdit(row);
    },
    // Jump to the Vault and highlight the owned copy of this book.
    async goToVault() {
      const match = this.bookVaultMatch;
      if (!match) return;
      const id = match.id;
      this.closeBookModal();
      await this.selectPanel("vault-books");
      this.vaultHighlightId = id;
    },

    // ---------- page-update popup (current page only — never total) ----------
    openPageModal(row) {
      this.pageModalRow = row;
      this.pageDraft = Number(row.onPage) || 0;
      this.pageModalOpen = true;
    },
    closePageModal() {
      this.pageModalOpen = false;
      this.pageModalRow = null;
    },
    pageBump(delta) {
      let n = (Number(this.pageDraft) || 0) + delta;
      const total = Number(this.pageModalRow && this.pageModalRow.pages) || 0;
      if (n < 0) n = 0;
      if (total) n = Math.min(n, total);
      this.pageDraft = n;
    },
    async savePage() {
      const row = this.pageModalRow;
      if (!row) return;
      let n = parseInt(this.pageDraft, 10);
      if (isNaN(n) || n < 0) n = 0;
      const total = Number(row.pages) || 0;
      if (total && n > total) n = total;
      // The server records the Reading Log entry (and "pages read" metric) when
      // onPage is written — no client-side event POST.
      if (!(await this.updateEntity(row.id, { onPage: n }))) return;
      await this.loadReadingEvents();
      this.closePageModal();
    },
    async finishBook(row) {
      await this.updateEntity(row.id, { status: "Read" });
      this.bookStage[row.id] = "rate";
    },
    async abandonBook(row) {
      delete this.bookStage[row.id];
      await this.updateEntity(row.id, { status: "Abandoned" });
    },
    async rateBook(row, stars) {
      delete this.bookStage[row.id];
      await this.updateEntity(row.id, { rating: "★".repeat(stars) });
    },
    async backToReading(row) {
      delete this.bookStage[row.id];
      await this.updateEntity(row.id, { status: "Reading" });
    },

    get watchingRows() {
      // Anything not finished belongs in the card: things marked Watching, ones
      // with no status yet (just added), and anything mid-flow (rating/next).
      return this.rows.filter(
        (r) => r.status === "Watching" || !r.status || this.watchStage[r.id],
      );
    },
    // Continue Watching is TV-only (episode progression). Movies aren't shown
    // here — they're logged straight from the add form (see saveModal).
    get watchingTvRows() {
      return this.watchingRows.filter((r) => r.type === "TV Show");
    },
    // Stage machine for a row's action buttons (helpers, not computed-member
    // expressions, because the Alpine CSP build only allows simple templates):
    //   none     → [Mark watching] [Mark watched]
    //   watching → [Next episode] [Mark watched] [Done]
    //   rate     → RATE ★ + [Next episode] [Skip]
    watchStageNone(row) {
      return !this.watchStage[row.id];
    },
    watchStageWatching(row) {
      return this.watchStage[row.id] === "watching";
    },
    watchStageRate(row) {
      return this.watchStage[row.id] === "rate";
    },
    isTvShow(row) {
      return row.type === "TV Show";
    },
    watchStageRated(row) {
      return this.watchStage[row.id] === "rated";
    },
    watchEpisodeLabel(row) {
      if (row.type !== "TV Show") return "";
      return "S" + (row.season || 1) + " · E" + String(row.episode || 1).padStart(2, "0");
    },
    // The next episode to watch — the Continue Watching card is forward-looking
    // ("what's up next"), so it shows the stored episode + 1.
    nextEpisodeLabel(row) {
      if (row.type !== "TV Show") return "";
      return "S" + (row.season || 1) + " · E" + String((Number(row.episode) || 0) + 1).padStart(2, "0");
    },
    // Same label for a logged event (uses the event's own season/episode).
    eventEpisodeLabel(ev) {
      if (ev.type !== "TV Show") return "";
      return "S" + (ev.season || 1) + " · E" + String(ev.episode || 1).padStart(2, "0");
    },
    fmtRuntime(min) {
      const n = Number(min);
      if (!(n > 0)) return "";
      if (n < 60) return `${n}m`;
      return `${Math.floor(n / 60)}h ${n % 60}m`;
    },
    // "2024 · 47m" — the TMDB-enriched year/runtime line for an event.
    watchMetaLine(ev) {
      return [ev.year, this.fmtRuntime(ev.runtimeMin)].filter(Boolean).join(" · ");
    },
    // Top characters (falls back to actor names) from the enriched cast, if any.
    eventCastLine(ev) {
      const cast = ev.meta && Array.isArray(ev.meta.cast) ? ev.meta.cast : [];
      const names = cast.slice(0, 4).map((c) => c.character || c.actor).filter(Boolean);
      return names.join(", ");
    },
    async loadScreenEvents() {
      const rows = await this.api("/admin/entities/screen-events").catch(() => []);
      this.screenEvents = (Array.isArray(rows) ? rows : [])
        .sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")))
        .slice(0, 20);
    },
    async loadReadingEvents() {
      const rows = await this.api("/admin/entities/reading-events").catch(() => []);
      this.readingEvents = (Array.isArray(rows) ? rows : [])
        .sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")))
        .slice(0, 20);
    },
    // Log one watch action (watched | watching) for the episode/movie, then
    // refresh the feed. Title/type/season/episode are captured now so the entry
    // reflects the state at the moment it was marked.
    async recordWatchEvent(row, action) {
      // Only one thing is "watching" — clear every other card's stage; the
      // caller re-sets this row's stage right after. Mirrors the server closing
      // other open watching items (see screen-autowatch.js).
      this.watchStage = {};
      await this.api("/admin/screen-events", {
        method: "POST",
        body: JSON.stringify({
          screenId: row.id,
          tmdbId: row.tmdbId,
          title: row.title,
          type: row.type,
          season: row.season,
          episode: row.episode,
          action,
        }),
      }).catch(() => {});
      await this.loadScreenEvents();
    },
    // Continue Watching shows the episode you're on (`row.season/episode`).
    // Marking it watching/watched records the event — the server advances the
    // stored position to the next episode — but the FE deliberately keeps showing
    // the episode you just marked (we don't re-read the rows) and offers a "Show
    // next episode" button. That button (or a page refresh) reveals the next
    // episode the server already holds.
    watchMarked(row) {
      return this.watchStage[row.id] === "marked";
    },
    async markWatching(row) {
      await this.recordWatchEvent(row, "watching"); // recordWatchEvent resets watchStage
      this.watchStage[row.id] = "marked";
    },
    async markWatched(row) {
      await this.recordWatchEvent(row, "watched");
      this.watchStage[row.id] = "marked";
    },
    async showNext(row) {
      // Reveal the next episode the server already advanced to.
      delete this.watchStage[row.id];
      await this.reloadScreenRows();
    },
    async reloadScreenRows() {
      if (!this.active || this.active.kind !== "screen") return;
      this.rows = await this.api(`/admin/entities/${this.active.kind}`).catch(() => this.rows);
    },

    // ---------- TV/film details popup (TMDB) ----------
    // `item` is a screen_log row (has tmdbId) or a screen_events entry (no
    // tmdbId — resolved from title+type server-side). Both carry title/type,
    // and for TV a season/episode to open on. `focus` forces the view: "show"
    // for the whole movie/series, "episode" to lead with one episode, "auto"
    // (default) picks episode when the item is a specific TV episode.
    async openDetails(item, focus = "auto") {
      this.detailRow = item;
      this.detail = null;
      this.detailError = "";
      this.detailSeason = null;
      this.detailSeasonData = null;
      this.detailEpisode = null;
      this.detailEpisodeObj = null;
      const isEpisode = item.type === "TV Show" && Number(item.episode) > 0;
      this.detailFocus = focus === "auto" ? (isEpisode ? "episode" : "show") : focus;
      this.detailOpen = true;
      this.detailLoading = true;
      try {
        const qs = new URLSearchParams();
        if (item.tmdbId) qs.set("tmdbId", item.tmdbId);
        if (item.type) qs.set("type", item.type);
        if (item.title) qs.set("title", item.title);
        this.detail = await this.api(`/admin/tmdb/details?${qs.toString()}`);
        if (this.detail && this.detail.kind === "tv") {
          const seasons = this.detail.seasons || [];
          const wanted = Number(item.season) || (seasons[0] && seasons[0].seasonNumber);
          if (seasons.some((s) => s.seasonNumber === wanted)) {
            // In episode focus, load the exact episode; otherwise just the season.
            await this.selectDetailSeason(wanted, this.detailFocus === "episode" ? Number(item.episode) : null);
          }
          // Meant to open a specific episode but it isn't on TMDB (e.g. old/bad
          // data like a season-1 episode 36) — show the series instead of a
          // blank popup.
          if (this.detailFocus === "episode" && !this.detailEpisodeObj) {
            this.detailFocus = "show";
            this.detailError = "That exact episode isn't on TMDB — showing the series.";
          }
        } else {
          this.detailFocus = "show"; // a movie has no episode view
        }
      } catch (e) {
        this.detailError = "Couldn't load details from TMDB.";
      } finally {
        this.detailLoading = false;
      }
    },
    async selectDetailSeason(n, openEpisode = null) {
      this.detailSeason = n;
      this.detailEpisode = null;
      this.detailEpisodeObj = null;
      this.detailSeasonData = null;
      this.detailSeasonLoading = true;
      try {
        this.detailSeasonData = await this.api(
          `/admin/tmdb/season?tmdbId=${encodeURIComponent(this.detail.tmdbId)}&season=${n}`,
        );
        if (openEpisode != null) {
          this.detailEpisode = openEpisode;
          this.detailEpisodeObj = (this.detailSeasonData.episodes || []).find((e) => e.episode === openEpisode) || null;
        }
      } catch (e) {
        this.detailError = "Couldn't load episodes.";
      } finally {
        this.detailSeasonLoading = false;
      }
    },
    // From the show view: switch the popup to that episode's own detail view.
    openEpisodeDetail(ep) {
      this.detailEpisode = ep.episode;
      this.detailEpisodeObj = ep;
      this.detailFocus = "episode";
      this.detailError = "";
    },
    // Switch an episode-focused popup back to the full show view.
    showFullShow() {
      this.detailFocus = "show";
      this.detailError = "";
    },
    closeDetails() {
      this.detailOpen = false;
      this.detailRow = null;
      this.detail = null;
      this.detailSeasonData = null;
      this.detailEpisodeObj = null;
    },
    // "★ 7.4 / 10" — a TMDB score line, blank when unknown.
    ratingLine(r) {
      return r != null ? `★ ${r} / 10` : "";
    },
    // Turn a cast array [{ character, actor }] into "Crystal — Betty Gilpin" bits.
    castList(cast, n = 10) {
      return (cast || [])
        .slice(0, n)
        .map((c) => (c.character ? c.character + (c.actor ? " — " + c.actor : "") : c.actor))
        .filter(Boolean);
    },

    // ---------- generic list: conditional fields ----------
    fieldVisible(f) {
      if (!f.onlyWhen) return true;
      const [key, val] = f.onlyWhen;
      // val may be a single value or a list of accepted values.
      return Array.isArray(val) ? val.includes(this.draft[key]) : this.draft[key] === val;
    },

    // ---------- generic list: modal open/close ----------
    // The modal renders whatever's in modalFields — either the full field
    // set (create/edit a list entry) or exactly one field (editing a single
    // row of a fixed FIELD/VALUE settings table, matching the design: each
    // settings field is its own row with its own edit popup, not one big form).
    modalFields: null,

    // The modal edits `draft`, never `formData`/`rows` directly — those stay
    // whatever the server last confirmed until Save actually succeeds. Cancel
    // just discards the draft. (Previously the settings popup edited
    // formData in place, which is also what the FIELD/VALUE table reads for
    // display — so typing changed the table live, and Cancel didn't revert.)
    draft: {},

    todayISO() {
      const d = new Date();
      const p = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    },
    openCreate() {
      this.modalMode = "create";
      this.editingId = null;
      this.modalFields = this.active.fields;
      this.draft = {};
      // New entries default their date field to today — most panels log
      // something that happened now (exercise, weigh-in, trip, etc.).
      for (const f of this.active.fields) {
        if (f.type === "date") this.draft[f.key] = this.todayISO();
        else this.draft[f.key] = f.type === "number" ? null : "";
      }
      if (this.active.kind === "habits") this.draft.kind = "manual";
      this.linkRows = [];
      this.query = "";
      this.searchResults = [];
      this.searchError = "";
      this.saveError = "";
      this.modalOpen = true;
    },
    openEdit(row) {
      this.modalMode = "edit";
      this.editingId = row.id;
      this.modalFields = this.active.fields;
      this.draft = { ...row };
      this.linkRows = Array.isArray(row.links) ? row.links.map((l) => ({ ...l })) : [];
      this.query = "";
      this.searchResults = [];
      this.searchError = "";
      this.saveError = "";
      this.modalOpen = true;
    },
    // Only that one field's current value needs to be in the draft — the
    // rest of formData (the other settings fields) is irrelevant here and
    // never touched until the server response comes back on save.
    openEditField(field) {
      this.modalMode = "edit-field";
      this.editingField = field;
      this.modalFields = [field];
      this.draft = { [field.key]: this.formData[field.key], _previewUrl: this.coverUrl(field, this.formData) };
      this.linkRows = [];
      this.query = "";
      this.searchResults = [];
      this.searchError = "";
      this.modalOpen = true;
    },
    closeModal() {
      this.modalOpen = false;
      this.pickerOpen = false;
    },
    modalTitle() {
      if (this.modalMode === "edit-field") return "Edit " + (this.editingField ? this.editingField.label : "");
      const verb = this.modalMode === "create" ? "Add to " : "Edit ";
      return verb + (this.active ? this.active.label : "");
    },

    async saveModal() {
      const panel = this.active;

      if (this.modalMode === "edit-field") {
        const key = panel.kind.split(":")[1];
        const field = this.editingField;
        const payload = { [field.key]: this.draft[field.key] };
        this.formData = await this.api(`/admin/settings/${key}`, { method: "PUT", body: JSON.stringify(payload) });
        this.modalOpen = false;
        this.pickerOpen = false;
        return;
      }

      const payload = { ...this.draft, ...(panel.fixed || {}) };
      if (panel.fields.some((f) => f.type === "links")) payload.links = this.linkRows.filter((l) => l.label || l.url);
      // Editing populates draft from the full row, so drop the server-managed
      // columns before writing: PUTting the updatedAt/createdAt timestamps back
      // breaks the Drizzle update (and used to fail silently — "save does
      // nothing"). The id travels in the URL, not the body.
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;

      try {
        // Habits has its own dedicated routes (/habits) rather than the
        // generic /admin/entities/:kind ones — it needs the extra server-side
        // validation in habits.js (kind/op/window enum checks), so it was
        // never folded into routes/admin-entities.js's LIST_ENTITIES.
        if (panel.kind === "habits") {
          if (this.modalMode === "create") {
            await this.api("/habits", { method: "POST", body: JSON.stringify(payload) });
          } else {
            await this.api(`/habits/${this.editingId}`, { method: "PUT", body: JSON.stringify(payload) });
          }
          this.habits = await this.api("/habits");
        } else {
          let created = null;
          if (this.modalMode === "create") {
            created = await this.api(`/admin/entities/${panel.kind}`, { method: "POST", body: JSON.stringify(payload) });
          } else {
            await this.api(`/admin/entities/${panel.kind}/${this.editingId}`, { method: "PUT", body: JSON.stringify(payload) });
          }
          this.rows = await this.api(`/admin/entities/${panel.kind}`);
          // Adding a movie with a Watching/Watched status logs it straight to the
          // watch log (movies have no continue-watching card). TV shows are
          // marked per-episode from the card instead, so they're skipped here.
          if (
            panel.kind === "screen" &&
            created &&
            created.type !== "TV Show" &&
            (created.status === "Watching" || created.status === "Watched")
          ) {
            await this.recordWatchEvent(created, created.status.toLowerCase());
          }
          // The server logs a Reading Log entry on book create/page-edit — refresh
          // the feed so it shows without a reload.
          if (panel.kind === "paper") await this.loadReadingEvents();
        }
        this.saveError = "";
        this.modalOpen = false;
        this.pickerOpen = false;
      } catch (e) {
        this.saveError = `Couldn't save: ${e.message}`;
      }
    },

    addLinkRow() {
      this.linkRows.push({ label: "", url: "" });
    },
    removeLinkRow(i) {
      this.linkRows.splice(i, 1);
    },

    // ---------- delete ----------
    askDelete(id) {
      this.deleteId = id;
    },
    cancelDelete() {
      this.deleteId = null;
    },
    async confirmDelete() {
      if (this.active.kind === "habits") {
        await this.api(`/habits/${this.deleteId}`, { method: "DELETE" });
        this.habits = await this.api("/habits");
        this.deleteId = null;
        return;
      }
      await this.api(`/admin/entities/${this.active.kind}/${this.deleteId}`, { method: "DELETE" });
      this.rows = await this.api(`/admin/entities/${this.active.kind}`);
      this.deleteId = null;
    },

    // ---------- search / lookup ----------
    async runSearch() {
      const panel = this.active;
      if (!panel.searchKind || !this.query.trim()) return;
      this.searching = true;
      this.searchError = "";
      try {
        const groups = await this.api(`/search/${panel.searchKind}?q=${encodeURIComponent(this.query.trim())}`);
        this.searchResults = groups;
      } catch (e) {
        this.searchError = e.message;
      } finally {
        this.searching = false;
      }
    },
    useResult(result) {
      const panel = this.active;
      const mapped = panel.searchMap ? panel.searchMap(result) : {};
      this.draft = { ...this.draft, ...mapped };
      // Picked from the Vault ("owned") → lock the catalogue detail fields (they
      // come from the vault record). Any other source, or picking a non-vault
      // result after a vault one, leaves them editable.
      this.draft._vaultLocked = result._provider === "vault";
      if (result.coverUrl || result.posterUrl) {
        this.draft._previewUrl = result.coverUrl || result.posterUrl;
      }
    },
    // A detail field is read-only when the draft was taken from the Vault.
    fieldLocked(f) {
      return !!(f.lockable && this.draft && this.draft._vaultLocked);
    },

    // ---------- cover / asset upload ----------
    // The server never stores a resolved URL — only the R2 key — so the
    // only two things that can produce a preview are (a) the upload
    // response, right after picking a file, or (b) looking the asset up in
    // the same library the Photos panel already fetches. Relying on the
    // upload response alone (_previewUrl, a field that only ever existed
    // client-side) is why covers used to vanish after save+reload: the
    // server echoes back photoAssetId but never that scratch field.
    //
    // `source` is explicit (not always `this.draft`) because this is used
    // both inside the modal (draft, unsaved) and in the settings table row
    // (formData, last-confirmed) — those must never be conflated, or typing
    // in the popup would change what the table shows before Save.
    coverUrl(field, source) {
      if (source._previewUrl) return source._previewUrl;
      const id = source[field.key];
      if (!id) return "";
      const asset = this.assetsById[id];
      return asset ? asset.url : "";
    },
    get assetsById() {
      const map = {};
      for (const a of this.assets) map[a.id] = a;
      return map;
    },
    async loadAssetLibrary() {
      try {
        this.assets = await this.api("/admin/assets");
      } catch {
        // cover previews just won't resolve until this succeeds; not fatal
      }
    },
    async uploadCover(field, fileInput) {
      const file = fileInput.files?.[0];
      if (!file) return;
      const body = new FormData();
      body.append("file", file);
      body.append("kind", field.assetKind || "other");
      const res = await fetch(`${window.API_BASE_URL}/admin/assets`, { method: "POST", credentials: "include", body });
      if (!res.ok) {
        this.error = res.status === 503 ? "R2 isn't configured yet." : `Upload failed (${res.status})`;
        return;
      }
      const asset = await res.json();
      this.draft[field.key] = asset.id;
      this.draft._previewUrl = asset.url;
      this.assets.push(asset); // so it resolves via assetsById too, not just the transient preview
      fileInput.value = "";
    },
    // Clears the reference in the draft — does not delete the asset itself
    // (it may be used elsewhere; delete it from the Photos library panel
    // directly if it should really go away). Only takes effect on Save.
    removeCover(field) {
      this.draft[field.key] = null;
      delete this.draft._previewUrl;
    },
    togglePicker() {
      this.pickerOpen = !this.pickerOpen;
      this.pickerQuery = "";
    },
    pickFromLibrary(field, asset) {
      this.draft[field.key] = asset.id;
      this.draft._previewUrl = asset.url;
      this.pickerOpen = false;
    },
    get filteredLibrary() {
      const q = this.pickerQuery.trim().toLowerCase();
      if (!q) return this.assets;
      return this.assets.filter((a) => (a.originalName || "").toLowerCase().includes(q));
    },

    // ---------- assets library panel ----------
    async uploadAsset(fileInput) {
      const files = Array.from(fileInput.files || []);
      if (!files.length) return;
      this.assetUploading = true;
      try {
        for (const file of files) {
          const body = new FormData();
          body.append("file", file);
          body.append("kind", "other");
          const res = await fetch(`${window.API_BASE_URL}/admin/assets`, { method: "POST", credentials: "include", body });
          if (!res.ok) {
            this.error = res.status === 503 ? "R2 isn't configured yet." : `Upload failed (${res.status})`;
            break;
          }
        }
        this.assets = await this.api("/admin/assets");
      } finally {
        this.assetUploading = false;
        fileInput.value = "";
      }
    },
    // Only unused assets are deletable (used ones hide the button and the API
    // refuses anyway) — and deletion goes through a confirm popup.
    assetDeleteTarget: null,
    askDeleteAsset(asset) {
      this.assetDeleteTarget = asset;
    },
    cancelDeleteAsset() {
      this.assetDeleteTarget = null;
    },
    async confirmDeleteAsset() {
      const asset = this.assetDeleteTarget;
      if (!asset) return;
      try {
        await this.api(`/admin/assets/${asset.id}`, { method: "DELETE" });
        this.assets = this.assets.filter((a) => a.id !== asset.id);
      } catch (e) {
        this.error = "Couldn't delete — the image is in use.";
      }
      this.assetDeleteTarget = null;
    },

    // ---------- blog ----------
    _lastAutoSlug: "",
    async loadBlog() {
      const posts = await this.api("/admin/entities/blog");
      this.blogPosts = posts.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    },
    newBlogPost() {
      this._lastAutoSlug = "";
      this.blogDraft = { title: "", slug: "", description: "", body: "", tags: "", status: "draft", date: this.todayISO() };
      this.renderPreview();
    },
    editBlogPost(post) {
      this.blogDraft = { ...post };
      this.renderPreview();
    },
    onBlogBody(v) {
      this.blogDraft.body = v;
      this.renderPreview();
    },
    // The Alpine CSP build doesn't apply x-html, so set the preview element's
    // innerHTML directly. Two paths:
    //  - initPreview($el): runs from the element's own x-init the moment it
    //    mounts, so the preview is filled on open (no edit needed).
    //  - renderPreview(): for subsequent edits, when the element already exists.
    initPreview(el) {
      el.innerHTML = this.blogPreview();
    },
    renderPreview() {
      const html = this.blogPreview();
      this.blogHtml = html;
      if (this.$refs.blogPreviewEl) this.$refs.blogPreviewEl.innerHTML = html;
    },
    cancelBlog() {
      this.blogDraft = null;
    },
    slugify(t) {
      return String(t || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    },
    // Auto-fill the slug from the title for a new post, until the user edits
    // the slug by hand (then leave theirs alone).
    onBlogTitle(v) {
      this.blogDraft.title = v;
      if (!this.blogDraft.id && (!this.blogDraft.slug || this.blogDraft.slug === this._lastAutoSlug)) {
        this.blogDraft.slug = this.slugify(v);
        this._lastAutoSlug = this.blogDraft.slug;
      }
    },
    async saveBlog() {
      const d = this.blogDraft;
      if (!d.title.trim()) {
        this.error = "Title is required.";
        return;
      }
      if (!d.slug.trim()) d.slug = this.slugify(d.title);
      this.blogSaving = true;
      try {
        const payload = { slug: d.slug, title: d.title, description: d.description, body: d.body, tags: d.tags, status: d.status, date: d.date };
        if (d.id) await this.api(`/admin/entities/blog/${d.id}`, { method: "PUT", body: JSON.stringify(payload) });
        else await this.api("/admin/entities/blog", { method: "POST", body: JSON.stringify(payload) });
        await this.loadBlog();
        this.blogDraft = null;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.blogSaving = false;
      }
    },
    askDeleteBlog(id) {
      this.blogDeleteId = id;
    },
    cancelDeleteBlog() {
      this.blogDeleteId = null;
    },
    async confirmDeleteBlog() {
      const id = this.blogDeleteId;
      await this.api(`/admin/entities/blog/${id}`, { method: "DELETE" });
      if (this.blogDraft && this.blogDraft.id === id) this.blogDraft = null;
      this.blogDeleteId = null;
      await this.loadBlog();
    },
    // Wrap the current textarea selection with before/after (toolbar actions).
    insertMd(before, after = "") {
      const ta = this.$refs.blogBody;
      const val = this.blogDraft.body || "";
      if (!ta) {
        this.blogDraft.body = val + before + after;
        this.renderPreview();
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const sel = val.slice(start, end);
      this.blogDraft.body = val.slice(0, start) + before + sel + after + val.slice(end);
      this.renderPreview();
      this.$nextTick(() => {
        ta.focus();
        ta.selectionStart = start + before.length;
        ta.selectionEnd = start + before.length + sel.length;
      });
    },
    async uploadBlogImage(fileInput) {
      const file = fileInput.files?.[0];
      if (!file) return;
      this.blogImageUploading = true;
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("kind", "other");
        const res = await fetch(`${window.API_BASE_URL}/admin/assets`, { method: "POST", credentials: "include", body });
        if (!res.ok) {
          this.error = res.status === 503 ? "R2 isn't configured yet." : `Upload failed (${res.status})`;
          return;
        }
        const asset = await res.json();
        const alt = file.name.replace(/\.[a-z0-9]+$/i, "");
        this.insertMd(`\n![${alt}](${asset.url})${this.imgAttrSuffix()}\n`, "");
        this.closeBlogImage();
      } finally {
        this.blogImageUploading = false;
        fileInput.value = "";
      }
    },
    openBlogImage() {
      this.blogImageModal = true;
      this.blogImageMode = "choice";
      this.blogImageSize = ".log-image";
      this.blogPickerQuery = "";
    },
    imgAttrSuffix() {
      return this.blogImageSize ? `{: ${this.blogImageSize}}` : "";
    },
    closeBlogImage() {
      this.blogImageModal = false;
      this.blogImageMode = "choice";
      this.blogPickerQuery = "";
    },
    async openBlogGallery() {
      this.blogImageMode = "gallery";
      await this.loadAssetLibrary();
    },
    get blogLibrary() {
      const q = this.blogPickerQuery.trim().toLowerCase();
      if (!q) return this.assets;
      return this.assets.filter((a) => (a.originalName || "").toLowerCase().includes(q));
    },
    blogInsertFromLibrary(a) {
      const alt = (a.originalName || "image").replace(/\.[a-z0-9]+$/i, "");
      this.insertMd(`\n![${alt}](${a.url})${this.imgAttrSuffix()}\n`, "");
      this.closeBlogImage();
    },
    // Link popup — prefills the text field with any current selection.
    openBlogLink() {
      const ta = this.$refs.blogBody;
      this.blogLinkText = ta ? (this.blogDraft.body || "").slice(ta.selectionStart, ta.selectionEnd) : "";
      this.blogLinkUrl = "";
      this.blogLinkNewTab = false;
      this.blogLinkModal = true;
    },
    closeBlogLink() {
      this.blogLinkModal = false;
    },
    insertBlogLink() {
      const text = this.blogLinkText.trim() || this.blogLinkUrl.trim() || "link";
      const url = this.blogLinkUrl.trim() || "https://";
      const attr = this.blogLinkNewTab ? '{:target="_blank" rel="noopener noreferrer"}' : "";
      this.replaceSelection(`[${text}](${url})${attr}`);
      this.blogLinkModal = false;
    },
    openBlogKramdown() {
      this.blogKramdownModal = true;
    },
    closeBlogKramdown() {
      this.blogKramdownModal = false;
    },
    insertKramdown(snippet) {
      this.insertMd(`${snippet}`, "");
      this.blogKramdownModal = false;
    },
    // Replace the current textarea selection (or insert at the cursor) with str.
    replaceSelection(str) {
      const ta = this.$refs.blogBody;
      const val = this.blogDraft.body || "";
      if (!ta) {
        this.blogDraft.body = val + str;
        this.renderPreview();
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      this.blogDraft.body = val.slice(0, start) + str + val.slice(end);
      this.renderPreview();
      this.$nextTick(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + str.length;
      });
    },
    blogPreview() {
      // Strip kramdown attribute lists ({: .class} / {:target=…}) — marked
      // doesn't render them, so they'd otherwise show as literal text. They
      // still apply on the public (kramdown) site.
      const md = ((this.blogDraft && this.blogDraft.body) || "").replace(/\{:[^}]*\}/g, "");
      if (window.marked) {
        try {
          return window.marked.parse ? window.marked.parse(md) : window.marked(md);
        } catch (e) {
          /* fall through */
        }
      }
      const div = document.createElement("div");
      div.textContent = md;
      return "<pre>" + div.innerHTML + "</pre>";
    },

    init() {
      let saved = null;
      try {
        saved = localStorage.getItem("admin-active-panel");
      } catch {}
      const isValid = saved === "connections" || this.panels.some((p) => p.id === saved);
      if (isValid) this.activeId = saved;

      if (this.activeId !== "connections") this.loadActive();
      this.loadAssetLibrary(); // independent of active panel, so cover fields resolve on any tab
      this.loadCounts(); // sidebar counts for every tab, not just the open one

      // The music/gaming feeds are fed by background API pollers, so refresh
      // them while you're looking at that panel — otherwise a track/session
      // recorded after the panel loaded wouldn't appear until a manual reload.
      setInterval(() => {
        if (this.activeId === "music") this.loadDerived("derived:music");
        else if (this.activeId === "play") this.loadDerived("derived:play");
        // The episode log gets auto-"watched" rows from the server once a
        // runtime elapses — refresh it (and the rows, for status changes) so
        // they appear without a manual reload.
        else if (this.activeId === "screen") {
          this.loadScreenEvents();
          this.api("/admin/entities/screen").then((r) => (this.rows = r)).catch(() => {});
        }
      }, 15000);
    },
  }));
});
