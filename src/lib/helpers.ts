import type { BanEntry } from "@/lib/types";

export function avatarUrl(entry: BanEntry): string | undefined {
  if (!entry.user.avatar) return;
  const ext = entry.user.avatar.startsWith("a_") ? "gif" : "webp";
  return `https://cdn.discordapp.com/avatars/${entry.user.id}/${entry.user.avatar}.${ext}?size=32`;
}

export function initials(entry: BanEntry): string {
  return (entry.user.global_name || entry.user.username).charAt(0).toUpperCase();
}
