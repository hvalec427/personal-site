import { loadBlogPosts } from "./blog";

// Real, timestamped events across every section, newest first — per the
// implementation plan this eventually merges Music/Screens/Paper/Play too,
// but today only Writing has a real dated source, so that's all this shows.
export interface ActivityEntry {
  when: string;
  tag: string;
  text: string;
  url: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
}

export function loadActivityLog(): ActivityEntry[] {
  return loadBlogPosts().map((post) => ({
    when: formatDate(post.date),
    tag: "POST",
    text: post.title,
    url: post.url,
  }));
}
