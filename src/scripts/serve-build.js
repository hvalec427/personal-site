#!/usr/bin/env node

import http from 'node:http';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { lookup } from 'mime-types';

const rootDir = path.resolve('build');
const port = Number(process.env.PORT || 4173);

async function serveFile(filePath, res) {
  const data = await fs.readFile(filePath);
  const mimeType = lookup(filePath) || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mimeType });
  res.end(data);
}

function sanitizeUrl(url) {
  try {
    return decodeURIComponent(new URL(url, `http://localhost`).pathname);
  } catch {
    return '/';
  }
}

const server = http.createServer(async (req, res) => {
  const requested = sanitizeUrl(req.url || '/');
  let filePath = path.join(rootDir, requested);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(400);
    res.end('Invalid request');
    return;
  }

  try {
    // Try the raw path
    let stat = await fs.stat(filePath).catch(() => null);

    if (stat && stat.isFile()) {
      await serveFile(filePath, res);
      return;
    }

    if (stat && stat.isDirectory()) {
      // If a same-name .html file exists (e.g. build/blog.html), prefer it
      const siblingHtml = filePath + '.html';
      const siblingStat = await fs.stat(siblingHtml).catch(() => null);
      if (siblingStat && siblingStat.isFile()) {
        await serveFile(siblingHtml, res);
        return;
      }

      // Otherwise serve the directory index
      filePath = path.join(filePath, 'index.html');
      await fs.access(filePath);
      await serveFile(filePath, res);
      return;
    }

    // Try with .html appended (so /page -> /page.html)
    const withHtml = filePath + '.html';
    stat = await fs.stat(withHtml).catch(() => null);
    if (stat && stat.isFile()) {
      await serveFile(withHtml, res);
      return;
    }

    // Try /index.html inside a folder (so /foo -> /foo/index.html)
    const indexInside = path.join(filePath, 'index.html');
    stat = await fs.stat(indexInside).catch(() => null);
    if (stat && stat.isFile()) {
      await serveFile(indexInside, res);
      return;
    }

    // If path is root, serve index.html
    if (requested === '/' || requested === '') {
      filePath = path.join(rootDir, 'index.html');
      await serveFile(filePath, res);
      return;
    }

    // Not found
    throw new Error('Not found');
  } catch (err) {
    console.error(`404: ${requested} -> ${filePath}`, err);
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.info(`Serving ${rootDir} at http://localhost:${port}`);
});
