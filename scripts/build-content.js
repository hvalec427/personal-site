import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

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
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      (_, label, url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
    );
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
    <header>
      <h1 class="header">
        <a href="/" class="header-link">Hvalec<span class="header-dot">.</span></a>
      </h1>
      <div class="header-buttons">
        <button id="theme-toggle" class="theme-toggle" onclick="toggleTheme()">🌙</button>
      </div>
    </header>
    <main class="content">
      <h1 id="${section.name}">${section.title}</h1>
      <p>${section.description}</p>
      <ul>
        ${items}
      </ul>
    </main>
    <footer>
      <span class="footer-copyright">© 2026, All rights reserved.</span>
      <div class="footer-links">
        <a href="https://github.com/hvalec427" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub</a>
        <a href="https://www.linkedin.com/in/hvalec/" target="_blank" rel="noopener noreferrer" class="footer-link">LinkedIn</a>
        <a href="/assets/ziga-hvalec-cv.pdf" download class="cv-button">Download CV</a>
      </div>
    </footer>
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
    <header>
      <h1 class="header">
        <a href="/" class="header-link">Hvalec<span class="header-dot">.</span></a>
      </h1>
      <div class="header-buttons">
        <button id="theme-toggle" class="theme-toggle" onclick="toggleTheme()">🌙</button>
      </div>
    </header>
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
    <footer>
      <span class="footer-copyright">© 2026, All rights reserved.</span>
      <div class="footer-links">
        <a href="https://github.com/hvalec427" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub</a>
        <a href="https://www.linkedin.com/in/hvalec/" target="_blank" rel="noopener noreferrer" class="footer-link">LinkedIn</a>
        <a href="/assets/ziga-hvalec-cv.pdf" download class="cv-button">Download CV</a>
      </div>
    </footer>
    <script defer src="https://cloud.umami.is/script.js" data-website-id="e3adec61-3166-4f84-a957-b6852d70e64b"></script>
  </body>
</html>`;
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
    const created = meta.created || meta.date;
    const title = meta.title || `Log entry #${++unnamedCount}`;
    const content = markdownToHtml(body);
    const html = renderPage(section, {
      title,
      content,
      created,
      updated: meta.updated,
    });
    mkdirSync(join(section.dist, slug), { recursive: true });
    writeFileSync(join(section.dist, slug, "index.html"), html);
    console.info(`  built: ${section.name}/${slug}/index.html`);
    entries.push({ slug, title, created });
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
