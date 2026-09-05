import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// main/_blog/*.md — the existing professional-site blog. Real posts, no
// draft flag in use today, so every file here is published. Feeds both the
// Writing section and (for now, the only real source) the Activity Log.
const BLOG_DIR = fileURLToPath(new URL("../../../../main/_blog/", import.meta.url));

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  url: string;
  minutes: number;
}

const WORDS_PER_MINUTE = 200;

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  if (!content.startsWith("---\n")) return { meta: {}, body: content };
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return { meta: {}, body: content };
  const meta: Record<string, string> = {};
  for (const line of content.slice(4, end).split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: content.slice(end + 5) };
}

export function loadBlogPosts(): BlogPost[] {
  let files: string[] = [];
  try {
    files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }

  const posts = files.map((file): BlogPost => {
    const slug = file.replace(/\.md$/, "");
    const raw = readFileSync(`${BLOG_DIR}${file}`, "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const words = body.trim().split(/\s+/).filter(Boolean).length;
    return {
      slug,
      title: meta.title ?? slug,
      description: meta.description ?? "",
      date: meta.created ?? "",
      url: `/blog/${slug}/`,
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    };
  });

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}
