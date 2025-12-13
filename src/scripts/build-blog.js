#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { marked } from 'marked';
import { articleTemplate, pageTemplate } from './templates.js';

const OUT_DIR = 'build/blog';
// Paths updated for project layout where pages are under `src/pages`.
const INPUT_DIR = path.join('src', 'pages', 'blog');
const INDEX_MD = path.join('src', 'pages', 'blog.md');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

function preprocessContainers(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  const stack = [];

  for (const line of lines) {
    const startMatch = line.match(/^:::\s*(\S+)\s*$/);
    if (startMatch) {
      stack.push(startMatch[1]);
      out.push(`<div class="${startMatch[1]}">`);
      continue;
    }

    if (line.trim() === ':::') {
      stack.pop();
      out.push('</div>');
      continue;
    }

    out.push(line);
  }

  while (stack.length) out.push('</div>');
  return out.join('\n');
}

function stripLeadingH1(md) {
  return md.replace(/^\s*#\s+.*(?:\r?\n|$)/, '');
}

function pickTitle({ frontmatter, markdownContent, relMdPath }) {
  return (
    frontmatter.title ??
    markdownContent.match(/^#\s+(.+)$/m)?.[1] ??
    path.basename(relMdPath, path.extname(relMdPath))
  );
}

function stripMd(md) {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[[^\]]*\]\([^)]+\)/g, '$1')
    .replace(/[#>*_~\-]{1,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugFor(relMdPath) {
  return path.basename(relMdPath, path.extname(relMdPath));
}

function articleOutPath(slug) {
  return path.join(OUT_DIR, `${slug}.html`);
}

async function buildArticle(relPath) {
  const abs = path.join(INPUT_DIR, relPath);
  const raw = await fs.readFile(abs, 'utf8');
  const { data, content } = matter(raw);

  const title = pickTitle({
    frontmatter: data,
    markdownContent: content,
    relMdPath: relPath,
  });

  let processed = preprocessContainers(content);
  processed = stripLeadingH1(processed);
  const contentHtml = marked.parse(processed);

  const slug = slugFor(relPath);
  await fs.writeFile(
    articleOutPath(slug),
    articleTemplate({ title, contentHtml, date: data.date, slug }),
    'utf8'
  );

  return {
    title,
    url: `/blog/${slug}.html`,
    date: data.date ? String(data.date) : null,
    tags: data.tags ?? null,
  };
}

async function buildIndex(items) {
  const blogPageRaw = await fs.readFile(INDEX_MD, 'utf8');
  const { data: blogMetadata, content: blogContent } = matter(blogPageRaw);
  const introHtml = marked.parse(preprocessContainers(blogContent));

  const contentHtml = `${introHtml}\n\n<section class="blog-list">\n${items
    .map(item => {
      const dateHtml = item.date ? item.date : '';
      return `<div class="blog-item">\n  <a href="${
        item.url
      }" class="blog-link">\n    <div class="blog-details">\n      <div>\n        <h3 class="blog-title">${
        item.title
      }</h3>\n        ${
        dateHtml ? `<span class="blog-date">${dateHtml}</span>` : ''
      }\n      </div>\n    </div>\n  </a>\n</div>`;
    })
    .join('\n')}
</section>`;

  blogMetadata.styles = blogMetadata.styles ?? ['css/blog.css'];
  const html = pageTemplate({
    frontmatter: blogMetadata,
    contentHtml,
  });
  await fs.writeFile(path.join('build', 'blog.html'), html, 'utf8');
}

async function build() {
  console.info('Building blog...');
  await ensureDir('build');
  await ensureDir(OUT_DIR);
  const files = await fg(['**/*.md', '**/*.markdown'], { cwd: INPUT_DIR });
  console.info(`Found ${files.length} articles`);

  const items = [];
  for (const rel of files) {
    const item = await buildArticle(rel);
    items.push(item);
    console.info(`✓ ${rel} -> ${path.basename(item.url)}`);
  }

  items.sort((a, b) => {
    const ad = a.date ? Date.parse(a.date) : 0;
    const bd = b.date ? Date.parse(b.date) : 0;
    return bd - ad || a.title.localeCompare(b.title);
  });

  await buildIndex(items);
  console.info(`✓ Built blog index with ${items.length} articles`);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
