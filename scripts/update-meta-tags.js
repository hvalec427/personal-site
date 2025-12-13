#!/usr/bin/env node

import fs from 'node:fs/promises';
import { generateMetaTags } from './meta-utils.js';

// Page configurations
const pages = [
  {
    slug: 'index',
    title: 'Žiga Hvalec - Mobile Developer',
    description:
      'Mobile developer focused on crafting fast, reliable, and polished apps.',
    url: 'https://hvalec.com/',
  },
  {
    slug: 'work-history',
    title: 'Work History - Žiga Hvalec',
    description:
      'Professional journey and experience of Žiga Hvalec in mobile development.',
    url: 'https://hvalec.com/work-history',
  },
  {
    slug: 'work-showcase',
    title: 'Work Showcase - Žiga Hvalec',
    description:
      'Portfolio of mobile apps and development projects by Žiga Hvalec.',
    url: 'https://hvalec.com/work-showcase',
  },
  {
    slug: 'doggie',
    title: 'My Dog - Žiga Hvalec',
    description: "Meet my furry coding companion - Žiga Hvalec's dog.",
    url: 'https://hvalec.com/doggie',
  },
  {
    slug: 'changelog',
    title: 'Changelog - Žiga Hvalec',
    description:
      "Development history and updates for Žiga Hvalec's personal website.",
    url: 'https://hvalec.com/changelog',
  },
];

async function updatePageMetaTags() {
  console.info('Updating meta tags for static pages...');

  for (const page of pages) {
    const filePath = page.slug === 'index' ? 'index.html' : `${page.slug}.html`;

    try {
      const content = await fs.readFile(filePath, 'utf8');

      // Find the title tag
      const titleRegex = /(<title>.*?<\/title>)/s;
      const titleMatch = content.match(titleRegex);

      if (!titleMatch) {
        console.warn(`No title tag found in ${filePath}`);
        continue;
      }

      // Find where to insert meta tags - look for existing meta tags or first link tag
      const afterTitle = content.substring(
        titleMatch.index + titleMatch[0].length
      );

      // Look for existing meta tags first, then link tags
      const metaRegex = /(\s*<meta[^>]*>)/;
      const linkRegex = /(\s*<link[\s\S]*?>)/;

      let insertionPoint;
      let matchIndex;

      // If there are existing meta tags, replace all meta content until link
      const existingMetaMatch = afterTitle.match(metaRegex);
      if (existingMetaMatch) {
        // Find the end of all meta tags by looking for the first link
        const linkMatch = afterTitle.match(linkRegex);
        if (linkMatch) {
          matchIndex = linkMatch.index;
          insertionPoint = linkMatch;
        } else {
          console.warn(`No link tag found after meta tags in ${filePath}`);
          continue;
        }
      } else {
        // No existing meta tags, look for first link
        const linkMatch = afterTitle.match(linkRegex);
        if (linkMatch) {
          matchIndex = linkMatch.index;
          insertionPoint = linkMatch;
        } else {
          console.warn(`No link tag found after title in ${filePath}`);
          continue;
        }
      }

      // Replace everything between title and first link with new meta tags
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
