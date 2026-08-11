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
        <a href="https://github.com/hvalec427" target="_blank" rel="noopener noreferrer" class="footer-link" aria-label="GitHub"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg></a>
        <a href="https://www.linkedin.com/in/hvalec/" target="_blank" rel="noopener noreferrer" class="footer-link" aria-label="LinkedIn"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg></a>
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
        <a href="https://github.com/hvalec427" target="_blank" rel="noopener noreferrer" class="footer-link" aria-label="GitHub"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg></a>
        <a href="https://www.linkedin.com/in/hvalec/" target="_blank" rel="noopener noreferrer" class="footer-link" aria-label="LinkedIn"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg></a>
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
