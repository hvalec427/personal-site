# Personal Portfolio Website

A modern, responsive portfolio website showcasing professional work experience, personal projects, and interests. Built with vanilla HTML, CSS, and JavaScript with a focus on clean design, performance, and user experience.

## Features

- **Responsive Design**: Optimized for all device sizes from mobile to desktop
- **Dynamic Theme System**: Light/dark theme toggle with random theme generator
- **Analytics Integration**: Visitor tracking and usage statistics
- **Clean Architecture**: Modular CSS structure for maintainability

## Deployment

### Vercel

This project is deployed using [Vercel](https://vercel.com), a platform for frontend frameworks and static sites. Vercel provides:

- **Automatic Deployments**: Every push to the main branch triggers a new deployment
- **Custom Domain Support**: Custom domain configuration with SSL certificates
- **Zero Configuration**: No build setup required for static HTML/CSS/JS projects

### Configuration

- Domain routing and redirects are handled through Vercel's configuration
- HTTPS is enabled by default

## Analytics

### Umami

Website analytics are powered by [Umami](https://umami.is), a privacy-focused, open-source alternative to Google Analytics:

- **Privacy-First**: No cookies, no personal data collection, GDPR compliant
- **Lightweight**: Minimal impact on site performance
- **Real-time Data**: Live visitor tracking and page view statistics
- **Simple Integration**: Single script tag provides comprehensive tracking

## Development

### Code Quality Tools

The project includes automated code quality tools to maintain consistent style and catch errors:

- **ESLint**: JavaScript linting with automatic error detection and fixing
- **Prettier**: Code formatting with consistent style across all files
- **Husky**: Git hooks for automated quality checks on commit
- **lint-staged**: Runs linters only on staged files for efficiency

## Blog Generation

The website includes an automated blog generation system that converts Markdown articles into static HTML pages with a consistent design and navigation structure.

### Features

- **Markdown to HTML Conversion**: Articles written in Markdown are automatically converted to styled HTML pages
- **Front Matter Support**: YAML front matter for metadata like title, date, description, and tags
- **Automatic Index Generation**: Dynamic blog index page with article listings and excerpts

### Build Process

The blog generation is handled by `scripts/build-blog.js` which:

1. **Scans Articles**: Finds all `.md` and `.markdown` files in the `articles/` directory
2. **Parses Content**: Extracts front matter metadata and Markdown content using `gray-matter`
3. **Converts to HTML**: Transforms Markdown to HTML using the `marked` library
4. **Generates Pages**: Creates individual article pages with consistent templates
5. **Builds Index**: Generates the main blog listing page with article previews
6. **Sorts Content**: Automatically sorts articles by date (newest first)

### Article Structure

Articles should be placed in the `articles/` directory with the following front matter:

```yaml
---
title: 'Article Title'
date: '2024-12-13'
description: 'Brief description for SEO and previews'
tags: ['tag1', 'tag2']
---
# Article content in Markdown...
```

### Usage

Generate the blog using npm scripts:

```bash
npm run build:blog
```

This creates:

- Individual article pages in `blog/[article-name].html`
- Main blog index at `blog.html`

## Theme System

The website features a sophisticated theme system supporting:

- Light and dark mode toggle
- Random theme generator with color harmony algorithms
