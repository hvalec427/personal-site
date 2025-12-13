#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export const pages = [
  {
    slug: 'index',
    title: 'Žiga Hvalec - Mobile Developer',
    ogTitle: 'Žiga Hvalec',
    ogSubtitle: 'Mobile Developer',
    description:
      'Mobile developer focused on crafting fast, reliable, and polished apps.',
    url: 'https://hvalec.com/',
  },
  {
    slug: 'blog',
    title: 'Blog - Žiga Hvalec',
    ogTitle: 'Blog',
    ogSubtitle: 'Žiga Hvalec',
    description:
      'My thoughts on games, development, and whatever else catches my attention.',
    url: 'https://hvalec.com/blog',
  },
  {
    slug: 'work-history',
    title: 'Work History - Žiga Hvalec',
    ogTitle: 'Work History',
    ogSubtitle: 'Žiga Hvalec',
    description:
      'Professional journey and experience of Žiga Hvalec in mobile development.',
    url: 'https://hvalec.com/work-history',
  },
  {
    slug: 'work-showcase',
    title: 'Work Showcase - Žiga Hvalec',
    ogTitle: 'Work Showcase',
    ogSubtitle: 'Žiga Hvalec',
    description:
      'Portfolio of mobile apps and development projects by Žiga Hvalec.',
    url: 'https://hvalec.com/work-showcase',
  },
  {
    slug: 'doggie',
    title: 'My Dog - Žiga Hvalec',
    ogTitle: 'My Dog',
    ogSubtitle: 'Žiga Hvalec',
    description: "Meet my furry coding companion - Žiga Hvalec's dog.",
    url: 'https://hvalec.com/doggie',
  },
  {
    slug: 'changelog',
    title: 'Changelog - Žiga Hvalec',
    ogTitle: 'Changelog',
    ogSubtitle: 'Žiga Hvalec',
    description:
      "Development history and updates for Žiga Hvalec's personal website.",
    url: 'https://hvalec.com/changelog',
  },
];

function generateBlogPosts() {
  const articlesDir = 'articles';

  if (!fs.existsSync(articlesDir)) {
    return [];
  }

  const mdFiles = fs
    .readdirSync(articlesDir)
    .filter(file => file.endsWith('.md'));

  return mdFiles.map(file => {
    const filePath = path.join(articlesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter } = matter(content);
    const slug = path.basename(file, '.md');

    const title =
      frontmatter.title ||
      slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const description = frontmatter.description || `Blog post: ${title}`;

    return {
      slug,
      title,
      ogTitle: title,
      ogSubtitle: 'Blog • Žiga Hvalec',
      description,
      url: `https://hvalec.com/blog/${slug}`,
    };
  });
}

export const blogPosts = generateBlogPosts();
