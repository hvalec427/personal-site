#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { marked } from 'marked';
import { pageTemplate } from './templates.js';

function preprocessContainers(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  const stack = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const startMatch = line.match(/^:::\s*(\S+)\s*$/);
    if (startMatch) {
      const cls = startMatch[1];
      stack.push(cls);
      out.push(`<div class=\"${cls}\">`);
      continue;
    }

    if (line.trim() === ':::') {
      out.push(`</div>`);
      continue;
    }

    out.push(line);
  }

  while (stack.length) {
    stack.pop();
    out.push('</div>');
  }

  return out.join('\n');
}

const PAGES_DIR = 'src/pages';
const ROOT_GLOB = ['**/*.md'];

const SKIP_FILES = new Set(['README.md', 'blog.md']);
const OUT_DIR = 'build';
const ASSETS_TO_COPY = ['css', 'js', 'assets'];

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyPublicContents(dest) {
  try {
    const entries = await fs.readdir('public');
    await ensureDir(dest);
    for (const entry of entries) {
      await fs.cp(path.join('public', entry), path.join(dest, entry), {
        recursive: true,
      });
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

async function copyStaticAssets(dest) {
  for (const asset of ASSETS_TO_COPY) {
    const srcCandidates = [path.join('src', asset), path.join(asset)];
    let copied = false;
    for (const src of srcCandidates) {
      try {
        const destPath = path.join(dest, asset);
        await fs.cp(src, destPath, { recursive: true });
        copied = true;
        break;
      } catch (err) {
        if (err.code === 'ENOENT') continue;
        throw err;
      }
    }

    if (!copied) {
    }
  }
}

async function build() {
  console.info('Building pages...');

  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await ensureDir(OUT_DIR);
  await copyPublicContents(OUT_DIR);
  await copyStaticAssets(OUT_DIR);

  const files = await fg(ROOT_GLOB, { cwd: PAGES_DIR, dot: false });
  const pages = files.filter(file => !SKIP_FILES.has(path.basename(file)));

  for (const rel of pages) {
    const abs = path.join(PAGES_DIR, rel);
    const raw = await fs.readFile(abs, 'utf8');
    const { data, content } = matter(raw);

    const contentProcessed = preprocessContainers(content);
    const contentHtml = marked.parse(contentProcessed);

    // determine output relative path (same structure, .html extension)
    const outRel = rel.replace(/\.[^/.]+$/, '.html');
    const outPath = path.join(OUT_DIR, outRel);

    const html = pageTemplate({ frontmatter: data, contentHtml });

    await ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, html, 'utf8');
    console.info(`✓ ${path.join(PAGES_DIR, rel)} -> ${outPath}`);
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
