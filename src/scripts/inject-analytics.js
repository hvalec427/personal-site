#!/usr/bin/env node

import fs from 'node:fs/promises';
import fg from 'fast-glob';

const BUILD_DIR = 'build';
const UMAMI_SNIPPET = `<script
      defer
      src="https://cloud.umami.is/script.js"
      data-website-id="e3adec61-3166-4f84-a957-b6852d70e64b"
    ></script>`;

async function inject() {
  const files = await fg(['**/*.html'], { cwd: BUILD_DIR, absolute: true });
  if (!files.length) {
    return;
  }

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');

      const headClose = '</head>';

      const idx = content.indexOf(headClose);
      if (idx === -1) {
        continue;
      }

      const before = content.slice(0, idx);
      const after = content.slice(idx);

      const injected = `${before}\n${UMAMI_SNIPPET}\n${after}`;
      await fs.writeFile(file, injected, 'utf8');
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }
}

inject().catch(err => {
  console.error(err);
  process.exit(1);
});
