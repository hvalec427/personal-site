import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC_LOGS = join(ROOT, "src/logs");
const DIST_LOGS = join(ROOT, "dist/logs");

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

    if (line.startsWith("### ")) {
      const text = line.slice(4);
      out.push(`<h3 id="${toId(text)}">${inline(text)}</h3>`);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      const text = line.slice(3);
      out.push(`<h2 id="${toId(text)}">${inline(text)}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      const text = line.slice(2);
      out.push(`<h1 id="${toId(text)}">${inline(text)}</h1>`);
      i++;
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
      !lines[i].startsWith("#") &&
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

function renderIndex(logs) {
  const items = logs
    .map(
      ({ slug, title }) =>
        `<li><a href="/logs/${slug}">${escapeHtml(title)}</a></li>`,
    )
    .join("\n        ");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Logs | Hvalec</title>
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
      <h1 id="logs">Logs</h1>
      <p>Welcome to the logs section. Here you will find a list of all logs.</p>
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

function renderPage({ title, content, created, updated }) {
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
          <a href="/logs" class="log-back">&larr; Logs</a>
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

mkdirSync(DIST_LOGS, { recursive: true });

const files = readdirSync(SRC_LOGS).filter((f) => f.endsWith(".md"));

const logs = [];

for (const file of files) {
  const raw = readFileSync(join(SRC_LOGS, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const slug = basename(file, ".md");
  const content = markdownToHtml(body);
  const html = renderPage({
    title: meta.title,
    content,
    created: meta.created,
    updated: meta.updated,
  });
  writeFileSync(join(DIST_LOGS, `${slug}.html`), html);
  console.info(`  built: logs/${slug}.html`);
  logs.push({ slug, title: meta.title, created: meta.created });
}

logs.sort((a, b) => b.created.localeCompare(a.created));
writeFileSync(join(DIST_LOGS, "index.html"), renderIndex(logs));
console.info(`  built: logs/index.html`);
