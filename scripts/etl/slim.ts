import { dropRejectedEntries } from "./filter.ts";
import { isObject } from "./json.ts";

/** メタ情報として落とすキー。 */
const META_KEYS = new Set(["guid", "hash", "attributes", "attribute_headers"]);

/** 名称系 content 配列のうち残す言語数（0=日本語, 1=英語）。 */
const LANG_LIMIT = 2;

function isLangArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * 汎用スリム化。
 * - 名称系 content を 32 言語 → 日英 2 要素に削減
 * - guid / hash / attributes などのメタ列を除去
 */
export function slimValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => slimValue(item)) as T;
  }
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (META_KEYS.has(key)) continue;
      out[key] =
        key === "content" && isLangArray(item) ? item.slice(0, LANG_LIMIT) : slimValue(item);
    }
    return out as T;
  }
  return value;
}

/**
 * 全カテゴリ共通の下地処理。各 dataset の transform はこれを呼んでから
 * カテゴリ固有のフィルタ・最適化を足す。
 */
export function baseTransform(group: Record<string, unknown>): Record<string, unknown> {
  return dropRejectedEntries(slimValue(group));
}
