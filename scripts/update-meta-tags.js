#!/usr/bin/env node

import fs from 'node:fs/promises';
import { generateMetaTags } from './meta-utils.js';
import { pages } from './pages-config.js';

async function updatePageMetaTags() {
  console.info('Updating meta tags for static pages...');

  for (const page of pages) {
    const filePath = page.slug === 'index' ? 'index.html' : `${page.slug}.html`;

    try {
      const content = await fs.readFile(filePath, 'utf8');

      const titleRegex = /(<title>.*?<\/title>)/s;
      const titleMatch = content.match(titleRegex);

      if (!titleMatch) {
        console.warn(`No title tag found in ${filePath}`);
        continue;
      }

      const afterTitle = content.substring(
        titleMatch.index + titleMatch[0].length
      );

      const metaRegex = /(\s*<meta[^>]*>)/;
      const linkRegex = /(\s*<link[\s\S]*?>)/;

      let insertionPoint;
      let matchIndex;

      const existingMetaMatch = afterTitle.match(metaRegex);
      if (existingMetaMatch) {
        const linkMatch = afterTitle.match(linkRegex);
        if (linkMatch) {
          matchIndex = linkMatch.index;
          insertionPoint = linkMatch;
        } else {
          console.warn(`No link tag found after meta tags in ${filePath}`);
          continue;
        }
      } else {
        const linkMatch = afterTitle.match(linkRegex);
        if (linkMatch) {
          matchIndex = linkMatch.index;
          insertionPoint = linkMatch;
        } else {
          console.warn(`No link tag found after title in ${filePath}`);
          continue;
        }
      }

      const beforeTitle = content.substring(
        0,
        titleMatch.index + titleMatch[0].length
      );
      const fromLink = content
        .substring(titleMatch.index + titleMatch[0].length + matchIndex)
        .trim();

      const newMetaTags = generateMetaTags(page);
      const updatedContent =
        beforeTitle + '\n    ' + newMetaTags + '\n\n    ' + fromLink + '\n';

      await fs.writeFile(filePath, updatedContent, 'utf8');
      console.info(`✓ Updated ${filePath}`);
    } catch (error) {
      console.error(`Error updating ${filePath}:`, error.message);
    }
  }
}

updatePageMetaTags().catch(console.error);
