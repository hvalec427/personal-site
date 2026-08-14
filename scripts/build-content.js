import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  existsSync,
  unlinkSync,
} from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// SOURCE_COMMIT is only set by Coolify during a real deploy (see
// write-deploy-time.js), so its absence means this is a local build —
// that's what gates draft: true content from appearing in production.
const isLocalBuild = !process.env.SOURCE_COMMIT;

const DRAFT_NOTICE =
  '<p style="border:1px dashed var(--highlight);padding:0.75rem 1rem;border-radius:8px;color:var(--highlight);"><strong>Draft</strong> — only visible in local builds.</p>';

const PARTIALS = {
  "<!-- include:header -->": readFileSync(
    join(ROOT, "partials/header.html"),
    "utf8",
  ),
  "<!-- include:footer -->": readFileSync(
    join(ROOT, "partials/footer.html"),
    "utf8",
  ),
};

function inlinePartials(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      inlinePartials(full);
      continue;
    }
    if (!entry.name.endsWith(".html")) continue;
    const html = readFileSync(full, "utf8");
    let inlined = html;
    for (const [placeholder, partial] of Object.entries(PARTIALS)) {
      const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const linePattern = new RegExp(`^([ \t]*)${escaped}\n?`, "m");
      inlined = inlined.replace(
        linePattern,
        (_, indent) =>
          partial
            .trimEnd()
            .split("\n")
            .map((line) => (line ? indent + line : line))
            .join("\n") + "\n",
      );
    }
    if (inlined !== html) writeFileSync(full, inlined);
  }
}

const SECTIONS = [
  {
    name: "logs",
    src: join(ROOT, "src/logs"),
    dist: join(ROOT, "dist/logs"),
    title: "Logs",
    description:
      "Tips, hacks, and solutions to issues I've encountered while working on projects.",
    backLabel: "Logs",
  },
  {
    name: "blog",
    src: join(ROOT, "src/blog"),
    dist: join(ROOT, "dist/blog"),
    title: "Blog",
    description:
      "Longer thoughts on development, tooling, and things I find interesting.",
    backLabel: "Blog",
  },
  {
    name: "recipes",
    src: join(ROOT, "src/recipes"),
    dist: join(ROOT, "dist/recipes"),
    title: "Recipes",
    description: "Recipes I actually cook and want to remember.",
    backLabel: "Recipes",
  },
];

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseFrontmatter(content) {
  if (!content.startsWith("---\n")) return { meta: {}, body: content };
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return { meta: {}, body: content };
  const meta = {};
  content
    .slice(4, end)
    .split("\n")
    .forEach((line) => {
      const colon = line.indexOf(":");
      if (colon !== -1)
        meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    });
  return { meta, body: content.slice(end + 5) };
}

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)(?:\{\.([^}]+)\})?/g,
      (_, alt, src, cls) =>
        `<a href="${src}" target="_blank" rel="noopener noreferrer"><img src="${src}" alt="${alt}" class="log-image${
          cls ? " " + cls : ""
        }" /></a>`,
    )
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g, (_, label, url) =>
      url.startsWith("/")
        ? `<a href="${url}">${label}</a>`
        : `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
    );
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(tableLines) {
  const header = parseTableRow(tableLines[0]);
  const rows = tableLines.slice(2).map(parseTableRow);
  const thead = `<tr>${header
    .map((cell) => `<th>${inline(cell)}</th>`)
    .join("")}</tr>`;
  const tbody = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`,
    )
    .join("\n");
  return `<div class="table-wrap"><table>\n<thead>${thead}</thead>\n<tbody>\n${tbody}\n</tbody>\n</table></div>`;
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      out.push(
        `<div class="code-block"><pre><code>${codeLines.join(
          "\n",
        )}\n</code></pre></div>`,
      );
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6}) (.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      out.push(`<h${level} id="${toId(text)}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        items.push(inline(lines[i].slice(2)));
        i++;
      }
      out.push(`<blockquote>${items.join(" ")}</blockquote>`);
      continue;
    }

    if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(`<li>${inline(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push(`<ul>\n${items.join("\n")}\n</ul>`);
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\. /, ""))}</li>`);
        i++;
      }
      out.push(`<ol>\n${items.join("\n")}\n</ol>`);
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      out.push(renderTable(tableLines));
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,6} /.test(lines[i]) &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith("```") &&
      !/^\d+\. /.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) out.push(`<p>${inline(paraLines.join(" "))}</p>`);
  }

  return out.join("\n");
}

function renderIndex(section, entries) {
  const items = entries
    .map(
      ({ slug, title }) =>
        `<li><a href="/${section.name}/${slug}">${escapeHtml(title)}</a></li>`,
    )
    .join("\n        ");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${section.title} | Hvalec</title>
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
    <link rel="manifest" href="/assets/site.webmanifest" />
    <link rel="stylesheet" href="/assets/css/main.css" />
    <script src="/assets/js/theme-toggle.js"></script>
    <script>
      if (typeof restoreThemeFromStorage === "function") {
        restoreThemeFromStorage();
      }
    </script>
    <script src="/assets/js/dog.js"></script>
    <script src="/assets/js/copy-code.js"></script>
  </head>
  <body>
    <!-- include:header -->
    <main class="content">
      <h1 id="${section.name}">${section.title}</h1>
      <p>${section.description}</p>
      <ul>
        ${items}
      </ul>
    </main>
    <!-- include:footer -->
    <script defer src="https://cloud.umami.is/script.js" data-website-id="e3adec61-3166-4f84-a957-b6852d70e64b"></script>
  </body>
</html>`;
}

function renderPage(section, { title, content, created, updated }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | Hvalec</title>
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
    <link rel="manifest" href="/assets/site.webmanifest" />
    <link rel="stylesheet" href="/assets/css/main.css" />
    <script src="/assets/js/theme-toggle.js"></script>
    <script>
      if (typeof restoreThemeFromStorage === "function") {
        restoreThemeFromStorage();
      }
    </script>
    <script src="/assets/js/dog.js"></script>
    <script src="/assets/js/copy-code.js"></script>
  </head>
  <body>
    <!-- include:header -->
    <main class="content">
      <link rel="stylesheet" href="/assets/css/log.css" />
      <article class="log-entry">
        <div class="log-content">
          <a href="/${section.name}" class="log-back">&larr; ${
            section.backLabel
          }</a>
          ${content}
        </div>
        <hr />
        <div class="log-meta">
          <span class="log-date-created">Created: ${created}</span>
          ${
            updated && updated !== created
              ? `<span class="log-date-updated">Updated: ${updated}</span>`
              : ""
          }
        </div>
      </article>
    </main>
    <!-- include:footer -->
    <script defer src="https://cloud.umami.is/script.js" data-website-id="e3adec61-3166-4f84-a957-b6852d70e64b"></script>
  </body>
</html>`;
}

function renderStandalonePage({ title, description, content }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | Hvalec</title>
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
    <link rel="manifest" href="/assets/site.webmanifest" />
    <link rel="stylesheet" href="/assets/css/main.css" />
    <script src="/assets/js/theme-toggle.js"></script>
    <script>
      if (typeof restoreThemeFromStorage === "function") {
        restoreThemeFromStorage();
      }
    </script>
    <script src="/assets/js/dog.js"></script>
    <script src="/assets/js/copy-code.js"></script>
  </head>
  <body>
    <!-- include:header -->
    <main class="content">
      <h1 id="${toId(title)}">${escapeHtml(title)}</h1>
      ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      ${content}
    </main>
    <!-- include:footer -->
    <script defer src="https://cloud.umami.is/script.js" data-website-id="e3adec61-3166-4f84-a957-b6852d70e64b"></script>
  </body>
</html>`;
}

const PAGES = [
  {
    name: "music",
    src: join(ROOT, "src/music.md"),
    dist: join(ROOT, "dist/music"),
  },
];

for (const page of PAGES) {
  const raw = readFileSync(page.src, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const isDraft = meta.draft === "true";

  if (isDraft && !isLocalBuild) {
    const rawCopy = join(ROOT, "dist", `${page.name}.md`);
    if (existsSync(rawCopy)) unlinkSync(rawCopy);
    console.info(`  skipped draft: ${page.name}`);
    continue;
  }

  const content = markdownToHtml(body);
  const html = renderStandalonePage({
    title: meta.title || page.name,
    description: meta.description,
    content: isDraft ? DRAFT_NOTICE + content : content,
  });
  mkdirSync(page.dist, { recursive: true });
  writeFileSync(join(page.dist, "index.html"), html);
  console.info(`  built: ${page.name}/index.html${isDraft ? " (draft)" : ""}`);
}

for (const section of SECTIONS) {
  mkdirSync(section.dist, { recursive: true });

  const files = readdirSync(section.src).filter((f) => f.endsWith(".md"));
  const entries = [];
  let unnamedCount = 0;

  for (const file of files) {
    const raw = readFileSync(join(section.src, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const slug = basename(file, ".md");
    const isDraft = meta.draft === "true";

    if (isDraft && !isLocalBuild) {
      const rawCopy = join(section.dist, file);
      if (existsSync(rawCopy)) unlinkSync(rawCopy);
      console.info(`  skipped draft: ${section.name}/${slug}`);
      continue;
    }

    const created = meta.created || meta.date;
    const title = meta.title || `Log entry #${++unnamedCount}`;
    const content = markdownToHtml(body);
    const html = renderPage(section, {
      title,
      content: isDraft ? DRAFT_NOTICE + content : content,
      created,
      updated: meta.updated,
    });
    mkdirSync(join(section.dist, slug), { recursive: true });
    writeFileSync(join(section.dist, slug, "index.html"), html);
    console.info(
      `  built: ${section.name}/${slug}/index.html${isDraft ? " (draft)" : ""}`,
    );
    entries.push({
      slug,
      title: isDraft ? `[DRAFT] ${title}` : title,
      created,
    });
  }

  entries.sort((a, b) => b.created.localeCompare(a.created));
  writeFileSync(
    join(section.dist, "index.html"),
    renderIndex(section, entries),
  );
  console.info(`  built: ${section.name}/index.html`);

  if (section.name === "blog") {
    writeFileSync(
      join(ROOT, "dist/assets/latest-posts.json"),
      JSON.stringify(
        entries.slice(0, 3).map(({ slug, title }) => ({ slug, title })),
      ),
    );
  }
}

inlinePartials(join(ROOT, "dist"));
