---
title: iOS 18 Auto-Applied Gradient on Simple App Icons
description: Testing what makes iOS 18 apply its automatic gradient treatment to app icons.
created: 2026-05-25
---

# iOS 18 Auto-Applied Gradient on Simple App Icons

iOS 18 introduced dark and tinted modes for app icons. Normal icons also got an update, the system automatically applies a gradient color treatment to icons it considers "simple".

Apple describes the behavior as crafted "intelligently to preserve design intent and maintain legibility", but the exact algorithm is undocumented. I did some basic tests to determe what is considered complex enough to skip this gradient.

## What makes an icon simple

- Only 2 colors
- More than 2 colors, but 2 dominate and the rest appear minimally

## What makes an icon complex

- Enough color variation across the icon
- Likely also gradients or complex shapes

## Examples

[![Simple icon](/assets/images/logs/ios-18-icon-gradient/original.png){: .log-image .very-small}](/assets/images/logs/ios-18-icon-gradient/original.png){:target="_blank" rel="noopener noreferrer"}
Flat, single-color glyph. No decorative elements, outlines, or dark pixels, gradient applied automatically.

[![Complex — bow](/assets/images/logs/ios-18-icon-gradient/bow.png){: .log-image .very-small}](/assets/images/logs/ios-18-icon-gradient/bow.png){:target="_blank" rel="noopener noreferrer"}
Has a bow/ribbon shape. The decorative curves prevent automatic treatment.

[![Complex — outlines](/assets/images/logs/ios-18-icon-gradient/outline.png){: .log-image .very-small}](/assets/images/logs/ios-18-icon-gradient/outline.png){:target="_blank" rel="noopener noreferrer"}
Built with visible outlines. Stroke heavy design breaks the tint pass. Click on icon to zoom in.

[![Complex — black pixels](/assets/images/logs/ios-18-icon-gradient/black-pixels.png){: .log-image .very-small}](/assets/images/logs/ios-18-icon-gradient/black-pixels.png){:target="_blank" rel="noopener noreferrer"}
Contains black pixels. Dark areas conflict with the gradient's lightness model.

## Sources

> "The system's automatically generated treatment … is crafted intelligently to preserve design intent and maintain legibility."

- [Configuring Your App Icon Using an Asset Catalog](https://developer.apple.com/documentation/xcode/configuring-your-app-icon?utm_source=chatgpt.com)
- [App Icons — Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
