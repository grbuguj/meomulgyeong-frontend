import type { TagInfo } from "../types";

export const TAGS: TagInfo[] = [
  { key: "hanok", label: "한옥·유교", emoji: "🏯" },
  { key: "nature", label: "자연·산림", emoji: "🌲" },
  { key: "sea", label: "바다", emoji: "🌊" },
  { key: "walk", label: "걷기", emoji: "🥾" },
  { key: "healing", label: "힐링", emoji: "🍃" },
  { key: "food", label: "음식", emoji: "🍚" },
  { key: "bike", label: "자전거", emoji: "🚲" },
  { key: "festival", label: "축제·행사", emoji: "🎉" },
];

export const TAG_MAP: Record<string, TagInfo> = TAGS.reduce(
  (acc, t) => ({ ...acc, [t.key]: t }),
  {} as Record<string, TagInfo>
);
