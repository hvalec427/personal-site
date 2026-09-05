import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// main/projects.md — the existing "Personal Projects" list from the
// professional site. Reused as-is rather than inventing a second, empty
// "hobby projects" data source: it's real, already-written project copy.
const PROJECTS_FILE = fileURLToPath(new URL("../../../../main/projects.md", import.meta.url));

export interface Project {
  state: string;
  name: string;
  blurb: string;
  url: string | null;
}

export function loadProjects(): Project[] {
  let raw: string;
  try {
    raw = readFileSync(PROJECTS_FILE, "utf8");
  } catch {
    return [];
  }

  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
  const blocks = body.split(/\n(?=### )/).filter((b) => b.startsWith("### "));

  return blocks.map((block): Project => {
    const name = block.match(/^### (.+)$/m)?.[1].trim() ?? "";
    const state = block.match(/^\*(.+)\*$/m)?.[1].trim().toUpperCase() ?? "";
    const blurb =
      block
        .split("\n\n")
        .find((p) => p.trim() && !p.startsWith("###") && !p.startsWith("*") && !p.startsWith("[") && !p.startsWith("Tags:") && !p.includes("{: .entry-when}"))
        ?.trim() ?? "";
    const firstLink = block.match(/\[([^\]]+)\]\(([^)]+)\)/);
    return { state, name, blurb, url: firstLink ? firstLink[2] : null };
  });
}
