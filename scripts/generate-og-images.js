#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { pages, blogPosts } from './pages-config.js';

const outDir = 'assets/og';
fs.mkdirSync(outDir, { recursive: true });

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
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              },
              children: [
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
                    children: page.ogTitle + (page.slug === 'index' ? '.' : ''),
                  },
                },

                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 32,
                      color: '#a1a1aa',
                      fontWeight: 400,
                      letterSpacing: '0.5px',
                    },
                    children: page.ogSubtitle,
                  },
                },

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
