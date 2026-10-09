import { asString, isObject } from "./json.ts";

const TAG_RE = /<[^>]*>/g;

/** ゲーム内リッチテキストのタグ（<COLOR ...> 等）を除去する。 */
export function cleanTags(text: string): string {
  return text.replace(TAG_RE, "");
}

/** 名称エントリから日本語名（content[0]）を取り出す。 */
export function getEntryJa(entry: unknown): string | undefined {
  if (!isObject(entry) || !Array.isArray(entry.content)) return undefined;
  return asString(entry.content[0]);
}

/**
 * 名称マスタがプレースホルダの未使用枠（#Rejected#）かどうか。
 * 日英いずれかに含まれていれば未使用とみなす。
 */
export function isRejectedEntry(entry: unknown): boolean {
  if (!isObject(entry) || !Array.isArray(entry.content)) return false;
  return entry.content.some(
    (part) => typeof part === "string" && cleanTags(part).includes("#Rejected#"),
  );
}

/** #Rejected# のエントリを再帰的に除去する（全カテゴリ共通の除外）。 */
export function dropRejectedEntries<T>(value: T): T {
  if (Array.isArray(value)) {
    const filtered = value.filter((item) => !isRejectedEntry(item));
    return filtered.map((item) => dropRejectedEntries(item)) as T;
  }
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = dropRejectedEntries(item);
    }
    return out as T;
  }
  return value;
}
