#!/usr/bin/env node

/**
 * Shared meta tag generation utilities
 */

export function generateMetaTags({
  title,
  description,
  url,
  slug,
  type = 'website',
}) {
  return `<meta
      name="description"
      content="${description}"
    />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:site_name" content="Hvalec" />
    <meta
      property="og:description"
      content="${description}"
    />
    <meta
      property="og:image"
      content="https://hvalec.com/assets/og/${slug}.png"
    />
    <meta
      property="og:image:secure_url"
      content="https://hvalec.com/assets/og/${slug}.png"
    />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@hvalec427" />
    <meta name="twitter:title" content="${title}" />
    <meta
      name="twitter:description"
      content="${description}"
    />
    <meta
      name="twitter:image"
      content="https://hvalec.com/assets/og/${slug}.png"
    />
    <meta name="twitter:image:alt" content="${title}" />

    <!-- Additional image metadata -->
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />`;
}
