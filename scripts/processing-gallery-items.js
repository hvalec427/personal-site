import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { execSync } from "child_process";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");

const GALLERY_CONFIG = path.join(PROJECT_ROOT, "photos.yml");
const THUMBNAILS_DIR = path.join(
  PROJECT_ROOT,
  "assets/images/photos/thumbnails"
);
const VIDEO_THUMBNAILS_DIR = path.join(
  PROJECT_ROOT,
  "assets/images/videos/thumbnails"
);
const FULL_SIZE_CLEAN_DIR = path.join(
  PROJECT_ROOT,
  "assets/images/photos/full-size"
);
const VIDEOS_DIR = path.join(PROJECT_ROOT, "assets/images/videos/full-size");
const GALLERY_IMAGES_COLLECTION = path.join(PROJECT_ROOT, "_photos");

// Supported file extensions
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];

// Ensure directories exist
[
  THUMBNAILS_DIR,
  VIDEO_THUMBNAILS_DIR,
  FULL_SIZE_CLEAN_DIR,
  VIDEOS_DIR,
  GALLERY_IMAGES_COLLECTION,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create thumbnail
async function createThumbnail(imagePath, id) {
  const thumbnailName = `${id}-thumb.webp`;
  const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);

  try {
    // Sharp automatically removes EXIF data when processing
    await sharp(imagePath)
      .resize(400, 300, {
        fit: "cover",
        position: "center",
      })
      .withMetadata(false)
      .webp({ quality: 80 })
      .toFile(thumbnailPath);

    // Use exiftool to completely strip any remaining metadata
    try {
      execSync(`exiftool -All= -overwrite_original "${thumbnailPath}"`, {
        stdio: "pipe",
      });
    } catch (e) {
      console.warn(
        `Warning: Could not use exiftool on thumbnail ${id}: ${e.message}`
      );
    }

    return thumbnailName;
  } catch (error) {
    console.error(`Error creating thumbnail for ${id}:`, error.message);
    return null;
  }
}

// Create video thumbnail (frame at 1 second)
async function createVideoThumbnail(videoPath, id) {
  const thumbnailName = `${id}-thumb.webp`;
  const thumbnailPath = path.join(VIDEO_THUMBNAILS_DIR, thumbnailName);

  try {
    // Use ffmpeg to extract a frame from the video at 1 second
    // Scale up and crop to fill 400x300 without black bars
    execSync(
      `ffmpeg -i "${videoPath}" -ss 1 -vframes 1 -vf "scale=400:300:force_original_aspect_ratio=increase,crop=400:300" -y "${thumbnailPath}" 2>/dev/null`,
      { stdio: "pipe" }
    );

    // Convert to WebP if ffmpeg output was not webp
    if (!thumbnailPath.endsWith(".webp")) {
      await sharp(thumbnailPath).webp({ quality: 80 }).toFile(thumbnailPath);
    }

    return thumbnailName;
  } catch (error) {
    console.error(`Error creating video thumbnail for ${id}:`, error.message);
    return null;
  }
}

// Create clean full-size image without EXIF
async function createCleanFullSize(imagePath, id) {
  const cleanFileName = `${id}.webp`;
  const cleanFilePath = path.join(FULL_SIZE_CLEAN_DIR, cleanFileName);

  try {
    // Convert to WebP without metadata
    await sharp(imagePath)
      .withMetadata(false)
      .webp({ quality: 85 })
      .toFile(cleanFilePath);

    // Use exiftool to completely strip all remaining metadata
    try {
      execSync(`exiftool -All= -overwrite_original "${cleanFilePath}"`, {
        stdio: "pipe",
      });
    } catch (e) {
      console.warn(
        `Warning: Could not use exiftool on full-size ${id}: ${e.message}`
      );
    }

    return cleanFileName;
  } catch (error) {
    console.error(
      `Error creating clean full-size image for ${id}:`,
      error.message
    );
    return null;
  }
}

// Copy and optimize video
async function copyVideo(videoPath, id) {
  const ext = path.extname(videoPath).toLowerCase();
  const videoFileName = `${id}${ext}`;
  const videoFilePath = path.join(VIDEOS_DIR, videoFileName);

  try {
    // For now, just copy the video file
    // In production, you might want to optimize/re-encode for web
    fs.copyFileSync(videoPath, videoFilePath);
    return videoFileName;
  } catch (error) {
    console.error(`Error copying video for ${id}:`, error.message);
    return null;
  }
}

// Process single image from photos config
async function processImage(imageConfig) {
  const { slug, url, date, title, description, type } = imageConfig;

  // slug is required
  if (!slug) {
    console.error(`Image config missing required 'slug' field:`, imageConfig);
    return null;
  }

  // Resolve the file path
  const filePath = path.join(PROJECT_ROOT, url);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }

  // Determine file type
  const ext = path.extname(filePath).toLowerCase();
  let isVideo = VIDEO_EXTENSIONS.includes(ext);
  let isImage = IMAGE_EXTENSIONS.includes(ext);

  // If type is explicitly specified, use that
  if (type === "video") {
    isVideo = true;
    isImage = false;
  } else if (type === "image") {
    isVideo = false;
    isImage = true;
  }

  if (!isImage && !isVideo) {
    console.error(
      `Unsupported file type for ${slug}: ${ext}. Supported: ${[
        ...IMAGE_EXTENSIONS,
        ...VIDEO_EXTENSIONS,
      ].join(", ")}`
    );
    return null;
  }

  // Create thumbnail
  let thumbnailName;
  if (isVideo) {
    thumbnailName = await createVideoThumbnail(filePath, slug);
  } else {
    thumbnailName = await createThumbnail(filePath, slug);
  }

  if (!thumbnailName) {
    console.error(`Failed to create thumbnail for ${slug}`);
    return null;
  }

  // Process based on type
  let filename;
  if (isVideo) {
    const videoFileName = await copyVideo(filePath, slug);
    if (!videoFileName) {
      console.error(`Failed to copy video for ${slug}`);
      return null;
    }
    filename = `videos/full-size/${videoFileName}`;
  } else {
    const cleanFileName = await createCleanFullSize(filePath, slug);
    if (!cleanFileName) {
      console.error(`Failed to create clean full-size image for ${slug}`);
      return null;
    }
    filename = `photos/full-size/${cleanFileName}`;
  }

  return {
    slug,
    filename,
    thumbnail: isVideo
      ? `videos/thumbnails/${thumbnailName}`
      : `photos/thumbnails/${thumbnailName}`,
    date,
    title: title || slug,
    description: description || "",
    type: isVideo ? "video" : "image",
  };
}

// Generate markdown file for photos item
function generateMarkdownFile(imageData) {
  const { slug, filename, thumbnail, date, title, description, type } =
    imageData;

  // Format date as YAML-compatible string (YYYY-MM-DD)
  let formattedDate = date;
  if (date instanceof Date) {
    formattedDate = date.toISOString().split("T")[0];
  } else if (typeof date === "string") {
    // If it's already a string, try to parse and reformat it
    try {
      formattedDate = new Date(date).toISOString().split("T")[0];
    } catch (e) {
      // Keep as is if parsing fails
      formattedDate = date;
    }
  }

  let frontmatter = `---
layout: photos-detail
title: ${title}
permalink: /photos/${slug}/
filename: ${filename}
thumbnail: ${thumbnail}
date: ${formattedDate}
type: ${type || "image"}
`;

  if (description) {
    frontmatter += `description: ${description}\n`;
  }

  frontmatter += "---\n";

  const filePath = path.join(GALLERY_IMAGES_COLLECTION, `${slug}.md`);
  fs.writeFileSync(filePath, frontmatter);
}

// Load photos config from YAML
function loadGalleryConfig() {
  try {
    const fileContents = fs.readFileSync(GALLERY_CONFIG, "utf8");
    return yaml.load(fileContents);
  } catch (error) {
    console.error(`Failed to load photos config: ${error.message}`);
    process.exit(1);
  }
}

// Main processing function
async function processGallery() {
  // Clear existing photos collection and media directories
  if (fs.existsSync(GALLERY_IMAGES_COLLECTION)) {
    fs.rmSync(GALLERY_IMAGES_COLLECTION, { recursive: true, force: true });
  }
  if (fs.existsSync(THUMBNAILS_DIR)) {
    fs.rmSync(THUMBNAILS_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(VIDEO_THUMBNAILS_DIR)) {
    fs.rmSync(VIDEO_THUMBNAILS_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(FULL_SIZE_CLEAN_DIR)) {
    fs.rmSync(FULL_SIZE_CLEAN_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(VIDEOS_DIR)) {
    fs.rmSync(VIDEOS_DIR, { recursive: true, force: true });
  }

  // Recreate directories
  [
    THUMBNAILS_DIR,
    VIDEO_THUMBNAILS_DIR,
    FULL_SIZE_CLEAN_DIR,
    VIDEOS_DIR,
    GALLERY_IMAGES_COLLECTION,
  ].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const config = loadGalleryConfig();

  if (!config.images || config.images.length === 0) {
    return;
  }

  for (const imageConfig of config.images) {
    const processed = await processImage(imageConfig);
    if (processed) {
      generateMarkdownFile(processed);
    }
  }
}

processGallery().catch(console.error);
