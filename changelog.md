---
layout: default
title: Changelog - Hvalec
---

# Changelog

Development history and major updates to this website.

<br/>

## v4.0.0 - Jekyll Migration

_January 5, 2026_

### Major: Complete migration from custom build system to Jekyll

- Migrated all pages and posts to Jekyll with front matter
- Created specialized layouts: `default.html`, `post.html`, `profile.html`, and `timeline.html`
- Maintained all existing designs and theme toggle functionality

## v3.3.0 - Markdown-first Content

_December 22, 2025_

### Major: Everything is now Markdown

- Migrated all pages, posts, and logs to Markdown sources.
- Simplified the build to a Markdown first pipeline that reads frontmatter and applies shared templates.
- Removed legacy HTML sources from the build input and unified page rendering.
- Improved frontmatter parsing and metadata consistency across pages.
- Small fixes: link normalization, sitemap updates, and faster incremental builds.

## v3.2.0 - Build System Optimization

_December 13, 2025_

### Minor: Unified configuration system and optimized build pipeline

- Created shared page configuration system for DRY principle
- Implemented dynamic blog post discovery from markdown files
- Optimized build order: blog -> OG images -> meta tags
- Removed duplicate meta tag generation from blog script
- Fixed HTML formatting consistency without Prettier dependency
- Enhanced meta tag generation with proper multi-line formatting
- Eliminated hardcoded blog post configurations

<br/>

## v3.1.0 - Social Media Optimization

_December 13, 2025_

### Minor: Complete social media integration with automated Open Graph image generation

- Added automated OG image generation using Satori + Sharp
- Implemented custom share images for all pages (1200x630px)
- Added comprehensive meta tags for Facebook, Twitter/X and LinkedIn
- Enhanced Twitter Cards with proper image metadata
- Added multi-platform social sharing support

<br/>

## v3.0.0 - Modern Architecture Rewrite

_December 12, 2025_

### Major: Complete website rewrite with modern tooling and blog system

- Complete rewrite from legacy codebase to modern architecture
- Created automated blog build system with Markdown support
- Added article templating with frontmatter parsing
- Implemented automatic blog index generation
- Set up Vercel deployment with proper output directory configuration
- Added ESLint, Prettier, and modern development tooling
- Enhanced SEO with structured meta tags for all content

<br/>

## v2.3.0 - Content Expansion

_August - September 2025_

### Minor: Enhanced content and mobile optimizations

- Added mobile-responsive design improvements
- Enhanced portfolio showcase with project cards
- Implemented shadow effects and visual polish
- Added screenshot updates and visual assets
- Fixed mobile height and layout issues

<br/>

## v2.0.0 - Design Revolution

_August 17, 2025_

### Major: Complete redesign with modern aesthetics and enhanced portfolio

- Complete visual redesign and user experience overhaul
- Added comprehensive professional portfolio sections
- Enhanced navigation and site structure
- Improved content organization and layout
- Added interactive contact forms and user engagement features

<br/>

## v1.5.0 - Feature Development Era

_2019 - 2021_

### Minor: Incremental improvements and feature additions

- Added contact form functionality
- Implemented Google site verification and SEO
- Enhanced translations and multilingual support
- Added smooth scrolling and navigation improvements
- Integrated Webpack build system
- Optimized CSS compression and performance

<br/>

## v1.2.0 - Professional Polish

_September - October 2018_

### Major: Professional features and multilingual support

- Added comprehensive internationalization (English/Slovene)
- Implemented language switching with banana-i18n
- Enhanced responsive hamburger menu system
- Added Google verification and SEO optimization
- Improved mobile navigation and user experience
- Enhanced portfolio content and professional text

<br/>

## v1.0.0 - Foundation & Launch

_September 13, 2018_

### Major: Initial website creation and responsive design system

- **Initial commit** - Website foundation created
- Built responsive design system from scratch
- Implemented CSS Grid and Flexbox layouts
- Created mobile-first responsive breakpoints
- Added custom favicon and branding elements
- Established core CSS architecture and design patterns
- Set up GitHub Pages hosting and deployment
