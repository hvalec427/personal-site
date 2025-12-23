#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { baseTemplate } from './templates.js';

const SITE_URL = 'https://hvalec.com';
const BUILD_DIR = 'build';
const OUT_PATH_BUILD = path.join(BUILD_DIR, 'sitemap.xml');
const OUT_HTML_BUILD = path.join(BUILD_DIR, 'map.html');

function buildXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      u =>
        '  <url>\n    <loc>' +
        u.loc +
        '</loc>\n' +
        (u.lastmod ? '    <lastmod>' + u.lastmod + '</lastmod>\n' : '') +
        '  </url>'
    )
    .join('\n')}\n</urlset>`;
}

async function generate() {
  const exists = await fs
    .access(BUILD_DIR)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    console.warn(
      `Build directory '${BUILD_DIR}' not found. Run the build first.`
    );
  }

  const files = await fg('**/*.html', {
    cwd: BUILD_DIR,
    dot: false,
    onlyFiles: true,
  });

  let urls = [];
  for (const rel of files) {
    if (
      rel.startsWith('assets/') ||
      rel.startsWith('css/') ||
      rel.startsWith('js/')
    ) {
      continue;
    }

    let urlPath = `/${rel}`;

    if (urlPath.endsWith('index.html')) {
      urlPath = urlPath.slice(0, -'index.html'.length);
      if (urlPath === '') urlPath = '/';
    } else if (urlPath.endsWith('.html')) {
      urlPath = urlPath.slice(0, -'.html'.length);
    }

    urlPath = urlPath.replace(/\/+/g, '/');

    const loc = `${SITE_URL}${urlPath}`;
    // Try to read the file mtime to use as <lastmod> for sitemap entries.
    const fullPath = path.join(BUILD_DIR, rel);
    const stats = await fs.stat(fullPath).catch(() => null);
    const lastmod = stats ? stats.mtime.toISOString().slice(0, 10) : undefined;
    urls.push({ loc, lastmod });
  }

  const sitemapHtmlLoc = `${SITE_URL}/map`;
  const sitemapAltLoc = `${SITE_URL}/sitemap`;
  const notIncluded = new Set([
    sitemapHtmlLoc,
    sitemapAltLoc,
    `${SITE_URL}/404`,
  ]);
  urls = urls.filter(u => !notIncluded.has(u.loc));

  const xml = buildXml(urls);

  // Ensure build directory exists and write sitemap files there only.
  await fs.mkdir(BUILD_DIR, { recursive: true });
  await fs.writeFile(OUT_PATH_BUILD, xml, 'utf8');

  const sorted = urls.slice().sort((a, b) => a.loc.localeCompare(b.loc));

  const listItems = sorted
    .map(u => {
      let pathname = u.loc.replace(SITE_URL, '') || '/';

      if (!pathname.startsWith('/')) pathname = `/${pathname}`;

      if (pathname.endsWith('.html')) {
        pathname = pathname.slice(0, -'.html'.length) || '/';
      }

      if (pathname !== '/' && pathname.endsWith('/')) {
        pathname = pathname.replace(/\/+$/, '');
      }

      return `    <li><a href="${pathname}">${pathname}</a></li>`;
    })
    .join('\n');

  const bodyHtml = `<main class="markdown">\n<h1>Sitemap</h1>\n<ul class="no-dots">\n${listItems}\n</ul>\n</main>`;

  const html = baseTemplate({
    title: 'Sitemap - Hvalec',
    bodyHtml,
    assetPrefix: '',
  });

  await fs.writeFile(OUT_HTML_BUILD, html, 'utf8');

  console.info(
    `Wrote sitemap with ${urls.length} entries to ${OUT_PATH_BUILD}`
  );
  console.info(`Wrote human sitemap to ${OUT_HTML_BUILD}`);
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
