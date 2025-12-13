#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { marked } from 'marked';

const INPUT_DIR = 'articles';
const OUT_DIR = './blog';

function getSlug(relMdPath) {
  return path.basename(relMdPath, path.extname(relMdPath));
}

function slugifyOutputHtml(relMdPath) {
  return getSlug(relMdPath) + '.html';
}

function urlFor(relMdPath) {
  return `/blog/${getSlug(relMdPath)}.html`;
}

function pickTitle({ frontmatter, markdownContent, relMdPath }) {
  return (
    frontmatter.title ??
    markdownContent.match(/^#\\s+(.+)$/m)?.[1] ??
    path.basename(relMdPath, path.extname(relMdPath))
  );
}

function stripMd(md) {
  return md
    .replace(/```[\\s\\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\\[[^\\]]*\\]\\([^)]+\\)/g, '')
    .replace(/\\[[^\\]]*\\]\\([^)]+\\)/g, '$1')
    .replace(/[#>*_~\\-]{1,}/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

function makeExcerpt({ frontmatter, markdownContent }, maxLen = 140) {
  const fromFm = frontmatter.description ?? frontmatter.excerpt;
  const raw = fromFm ? String(fromFm) : stripMd(markdownContent);
  if (raw.length <= maxLen) return raw;
  return raw.slice(0, maxLen - 1).trimEnd() + '…';
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

function baseTemplate({
  title,
  bodyHtml,
  isArticle = false,
  description = '',
  slug = '',
}) {
  const pageTitle = `${title} - Hvalec`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=block" rel="stylesheet" />
    <link rel="stylesheet" href="../css/normalize.css">
    <link rel="stylesheet" href="../css/main.css">
    <link rel="stylesheet" href="../css/header.css">
    <link rel="stylesheet" href="../css/footer.css">
    ${
      isArticle
        ? '<link rel="stylesheet" href="../css/article.css">'
        : '<link rel="stylesheet" href="css/blog.css">'
    }
    <script src="../js/theme-toggle.js"></script>
    <script defer src="https://cloud.umami.is/script.js" data-website-id="e3adec61-3166-4f84-a957-b6852d70e64b"></script>
</head>

<body class="other-pages">
    <header>
        <h1 class="header"><a href="../">Hvalec</a><span class="header-dot">.</span></h1>
        <div class="header-buttons">
            <button id="theme-toggle" class="theme-toggle" onclick="toggleTheme()">🌙</button>
        </div>
    </header>

    <main>
        ${bodyHtml}
    </main>

    <footer>
        <span class="footer-copyright">© 2025, All rights reserved.</span>
        <div class="footer-links">
            <a href="https://github.com/hvalec427" target="_blank" class="footer-link">GitHub</a>
            <a href="https://www.linkedin.com/in/hvalec/" target="_blank" class="footer-link">LinkedIn</a>
            <a href="../assets/cv.pdf" download class="cv-button">Download CV</a>
        </div>
    </footer>
</body>
</html>`;
}

function articleTemplate({ title, contentHtml, date, slug, excerpt }) {
  const dateHtml = date ? `<div class="article-date">${date}</div>` : '';

  const bodyHtml = `<div class="article-container">
    <nav class="article-nav">
        <a href="../blog.html" class="back-link">← Back to Blog</a>
    </nav>
    <article class="article">
        <header class="article-header">
            <h1 class="article-title">${title}</h1>
            ${dateHtml}
        </header>
        <div class="article-content">
            ${contentHtml}
        </div>
    </article>
</div>`;

  return baseTemplate({
    title,
    bodyHtml,
    isArticle: true,
    description: excerpt,
    slug,
  });
}

function blogIndexTemplate({ items }) {
  const articles = items
    .map(item => {
      const dateHtml = item.date ? item.date : '';

      return `<div class="blog-item">
            <a href="${item.url}" class="blog-link">
              <div class="blog-details">
                <div>
                  <h3 class="blog-title">
                    ${item.title}
                  </h3>
                  ${
                    dateHtml ? `<span class="blog-date">${dateHtml}</span>` : ''
                  }
                </div>

                <p class="blog-excerpt">
                  ${item.excerpt}
                </p>
              </div>
            </a>
          </div>`;
    })
    .join('\\n');

  const bodyHtml = `<main>
    <div class="intro-section">
        <h2 class="page-title">Blog</h2>
        <p class="page-description">
            My thoughts on games, development, and whatever else catches my attention.
        </p>
    </div>
    
    <section class="blog-list">
        ${articles}
    </section>
</main>`;

  return baseTemplate({
    title: 'Blog',
    bodyHtml,
    description:
      'My thoughts on games, development, and whatever else catches my attention.',
    slug: 'blog',
  });
}

async function build() {
  console.info('Building blog...');

  await ensureDir(OUT_DIR);

  const files = await fg(['**/*.md', '**/*.markdown'], { cwd: INPUT_DIR });
  console.info(`Found ${files.length} articles`);

  const articles = [];

  for (const rel of files) {
    const abs = path.join(INPUT_DIR, rel);
    const raw = await fs.readFile(abs, 'utf8');

    const { data, content } = matter(raw);
    const title = pickTitle({
      frontmatter: data,
      markdownContent: content,
      relMdPath: rel,
    });
    const excerpt = makeExcerpt(
      { frontmatter: data, markdownContent: content },
      160
    );

    const contentHtml = marked.parse(content);
    const outName = slugifyOutputHtml(rel);
    const outPath = path.join(OUT_DIR, outName);
    const slug = getSlug(rel);

    await fs.writeFile(
      outPath,
      articleTemplate({
        title,
        contentHtml,
        date: data.date,
        slug,
        excerpt,
      }),
      'utf8'
    );

    articles.push({
      title,
      excerpt,
      url: urlFor(rel),
      date: data.date ? String(data.date) : null,
      tags: data.tags ?? null,
    });

    console.info(`✓ ${rel} -> ${outName}`);
  }

  articles.sort((a, b) => {
    const ad = a.date ? Date.parse(a.date) : 0;
    const bd = b.date ? Date.parse(b.date) : 0;
    return bd - ad || a.title.localeCompare(b.title);
  });

  await fs.writeFile(
    path.join('./', 'blog.html'),
    blogIndexTemplate({ items: articles }),
    'utf8'
  );

  console.info(`✓ Built blog index with ${articles.length} articles`);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
