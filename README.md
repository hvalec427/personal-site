# Personal Portfolio Website

A modern, responsive portfolio website showcasing professional work experience, personal projects, and interests. Built with Jekyll, Markdown, HTML, CSS, and JavaScript with a focus on clean design, performance, and user experience.

## Features

- **Jekyll-powered static site generation**: Fast, simple, and maintainable content structure
- **Responsive Design**: Optimized for all device sizes from mobile to desktop
- **Dynamic Theme System**: Light/dark theme toggle with random theme generator
- **Analytics Integration**: Visitor tracking with Umami (privacy-focused)
- **Markdown-first content**: Write pages and posts in Markdown with front matter
- **Clean Architecture**: Modular CSS and reusable layouts

## Deployment

### Vercel

This project is deployed using [Vercel](https://vercel.com), a platform for frontend frameworks and static sites. Vercel provides:

- **Automatic Deployments**: Every push to the main branch triggers a new deployment
- **Custom Domain Support**: Custom domain configuration with SSL certificates

### Configuration

- HTTPS is enabled by default

## Local Development

### Prerequisites

- Ruby 2.7 or higher
- Bundler

### Setup

```bash
# Install gems
bundle install

# Start Jekyll server
bundle exec jekyll serve

# Build for production
bundle exec jekyll build
```

The site will be available at `http://localhost:4000`

## Analytics

### Umami

Website analytics are powered by [Umami](https://umami.is), a privacy-focused, open-source alternative to Google Analytics:

- **Privacy-First**: No cookies, no personal data collection, GDPR compliant
- **Lightweight**: Minimal impact on site performance
- **Real-time Data**: Live visitor tracking and page view statistics
- **Simple Integration**: Single script tag provides comprehensive tracking

## Project Structure

- `_layouts/` - Reusable HTML templates
- `_posts/` - Blog posts in Markdown
- `assets/` - CSS, JavaScript, fonts, and images
- `***.md` - Individual pages (Jekyll converts to HTML)
- `_config.yml` - Jekyll configuration
- `Gemfile` - Ruby dependencies

## Code Quality Tools

The project includes automated code quality tools:

- **ESLint**: JavaScript linting with automatic error detection and fixing
- **Prettier**: Code formatting with consistent style across all files

## Theme System

The website features a theme system supporting:

- Light and dark mode toggle with persistence
- Random theme generator
- All theme colors defined as CSS custom properties

## Building and Deploying

```bash
# Install dependencies
bundle install

# Build the site
bundle exec jekyll build

# Output is in _site/ directory
```
