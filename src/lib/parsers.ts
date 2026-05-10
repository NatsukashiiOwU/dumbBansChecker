import type { ParsedItem } from "@/lib/types";

function cleanItem(s: string): string {
  return s
    .replace(/^<@!?(\d+)>$/, "$1") // <@!id> -> id
    .replace(/^@/, "") // @user -> user
    .replace(/#\d{4}$/, "") // user#1234 -> user
    .replace(/\s*\(.*?\)\s*/g, "") // "text (comment)" -> "text"
    .trim();
}

export function parseList(input: string): ParsedItem[] {
  return input
    .split(/[\n,;\t|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      const idMatch = raw.match(/\b(\d{17,19})\b/);
      const id = idMatch?.[1];
      const cleaned = cleanItem(raw)
        .replace(/\b\d{17,19}\b/g, "") // remove captured IDs
        .trim();
      return {
        raw,
        id,
        username: cleaned || undefined,
      };
    });
}
