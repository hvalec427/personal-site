import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// profile/src/shelves/*.md — the real "everything owned" catalogues (physical
// books/games/records). No dates-read or ratings live here, only inventory,
// so this only ever backs the Vault section, never Paper/Play/Music history.
const SHELVES_DIR = fileURLToPath(new URL("../../../src/shelves/", import.meta.url));

export type VaultKind = "book" | "game" | "album";

export interface VaultItem {
  kind: VaultKind;
  title: string;
  meta: string;
  year: string;
  cover: string | null;
  order: number;
}

function parseTableRows(markdown: string): string[][] {
  const lines = markdown.split("\n").filter((line) => line.trim().startsWith("|"));
  // First row is the header, second is the `---` separator.
  const rows = lines.slice(2);
  return rows.map((line) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim()),
  );
}

function coverFromCell(cell: string): string | null {
  const match = cell.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
  return match ? match[1] : null;
}

function readShelf(filename: string): string[][] {
  try {
    return parseTableRows(readFileSync(`${SHELVES_DIR}${filename}`, "utf8"));
  } catch {
    return [];
  }
}

export function loadVault(): VaultItem[] {
  const books = readShelf("books.md").map(
    ([cover, title, author, , originalYear], i): VaultItem => ({
      kind: "book",
      title,
      meta: author,
      year: originalYear ?? "",
      cover: coverFromCell(cover),
      order: i,
    }),
  );

  const games = readShelf("games.md").map(
    ([cover, title, platform, genre, year], i): VaultItem => ({
      kind: "game",
      title,
      meta: [platform, genre].filter(Boolean).join(" · "),
      year: year ?? "",
      cover: coverFromCell(cover),
      order: i,
    }),
  );

  const albums = readShelf("music.md").map(
    ([cover, title, artist, , format, year], i): VaultItem => ({
      kind: "album",
      title,
      meta: [artist, format].filter(Boolean).join(" · "),
      year: year ?? "",
      cover: coverFromCell(cover),
      order: i,
    }),
  );

  return [...books, ...games, ...albums];
}
