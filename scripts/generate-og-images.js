#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const outDir = 'assets/og';
fs.mkdirSync(outDir, { recursive: true });

// Load Fira Code font
const fontPath = 'assets/fonts/FiraCode-Regular.ttf';
const fontBoldPath = 'assets/fonts/FiraCode-Bold.ttf';

let fontData, fontBoldData;
try {
  fontData = fs.readFileSync(fontPath);
  fontBoldData = fs.readFileSync(fontBoldPath);
} catch {
  console.error(
    'Font files not found. Please download Fira Code fonts to assets/fonts/'
  );
  console.error('Download from: https://github.com/tonsky/FiraCode/releases');
  process.exit(1);
}

// Define pages that need OG images
const pages = [
  {
    slug: 'index',
    title: 'Žiga Hvalec',
    subtitle: 'Mobile Developer',
    description:
      'Mobile developer focused on crafting fast, reliable, and polished apps.',
  },
  {
    slug: 'blog',
    title: 'Blog',
    subtitle: 'Žiga Hvalec',
    description:
      'My thoughts on games, development, and whatever else catches my attention.',
  },
  {
    slug: 'work-history',
    title: 'Work History',
    subtitle: 'Žiga Hvalec',
    description: 'Professional journey and experience in mobile development.',
  },
  {
    slug: 'work-showcase',
    title: 'Work Showcase',
    subtitle: 'Žiga Hvalec',
    description: 'Portfolio of mobile apps and development projects.',
  },
  {
    slug: 'doggie',
    title: 'My Dog',
    subtitle: 'Žiga Hvalec',
    description: 'Meet my furry coding companion.',
  },
  {
    slug: 'changelog',
    title: 'Changelog',
    subtitle: 'Žiga Hvalec',
    description: 'Development history and website updates.',
  },
];

// Generate individual blog post images (you can expand this)
const blogPosts = [
  {
    slug: 'ps5-exclusives-2025',
    title: "Best PS5 Exclusives I've Played This Year",
    subtitle: 'Blog • Žiga Hvalec',
  },
];

const allPages = [
  ...pages,
  ...blogPosts.map(post => ({ ...post, description: '' })),
];

for (const page of allPages) {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
          color: 'white',
          fontFamily: 'Fira Code',
          position: 'relative',
        },
        children: [
          // Main content
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              },
              children: [
                // Title
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: page.slug === 'index' ? 72 : 64,
                      lineHeight: 1.1,
                      fontWeight: 700,
                      color: '#ffffff',
                      letterSpacing: '-2px',
                    },
                    children: page.title + (page.slug === 'index' ? '.' : ''),
                  },
                },
                // Subtitle
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 32,
                      color: '#a1a1aa',
                      fontWeight: 400,
                      letterSpacing: '0.5px',
                    },
                    children: page.subtitle,
                  },
                },
                // Description (if exists)
                ...(page.description
                  ? [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 24,
                            color: '#71717a',
                            lineHeight: 1.4,
                            maxWidth: '800px',
                            marginTop: '16px',
                          },
                          children: page.description,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
          // Footer with URL and code accent
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 24,
                      color: '#71717a',
                      fontWeight: 400,
                      letterSpacing: '0.5px',
                    },
                    children: 'hvalec.com',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 20,
                      color: '#52525b',
                      fontWeight: 500,
                    },
                    children: '~/dev/portfolio',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Fira Code', data: fontData, weight: 400, style: 'normal' },
        { name: 'Fira Code', data: fontBoldData, weight: 700, style: 'normal' },
      ],
    }
  );

  const pngPath = path.join(outDir, `${page.slug}.png`);
  await sharp(Buffer.from(svg)).png().toFile(pngPath);
  console.info('✓ Generated', pngPath);
}

console.info(`\n🎉 Generated ${allPages.length} OG images in ${outDir}/`);
