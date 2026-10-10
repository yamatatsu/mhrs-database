import { loadDataset } from "@/shared/api";
import type { ItemNameTable } from "@/shared/lib";

/** アイテム名マスタの name 列（`I_<id>_Name`、MR は `_Name_MR`）から id を抽出する。 */
const ITEM_NAME_RE = /^I_(\d+)_Name(?:_MR)?$/;
/** 素材カテゴリ名マスタの name 列（`ICT_Name_<id>`）から id を抽出する。 */
const MATERIAL_CATEGORY_NAME_RE = /^ICT_Name_(\d+)$/;

/**
 * 名称マスタ（`{ entries: [{ name, content: [日本語, 英語] }] }`）から
 * id → 日本語名を集める。武器詳細のレシピ素材は id で保持されるため、
 * 表示用の参照テーブルをここで構築する。
 */
function collectNames(container: unknown, pattern: RegExp, out: Record<number, string>): void {
  if (typeof container !== "object" || container === null) return;
  const entries = (container as { entries?: unknown }).entries;
  if (!Array.isArray(entries)) return;
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const { name, content } = entry as { name?: unknown; content?: unknown };
    if (typeof name !== "string" || !Array.isArray(content)) continue;
    const match = pattern.exec(name);
    if (!match) continue;
    const ja = content[0];
    if (typeof ja === "string") out[Number(match[1])] = ja;
  }
}

/**
 * レシピ素材の id → 名称テーブルを `items` データから構築する。
 * `loadDataset` のメモリキャッシュにより、2 回目以降は再取得しない。
 */
export async function loadItemNames(): Promise<ItemNameTable> {
  const data = await loadDataset<Record<string, unknown>>("items");
  const items: Record<number, string> = {};
  const materialCategories: Record<number, string> = {};
  collectNames(data.items_name_msg, ITEM_NAME_RE, items);
  collectNames(data.items_name_msg_mr, ITEM_NAME_RE, items);
  collectNames(data.material_category_msg, MATERIAL_CATEGORY_NAME_RE, materialCategories);
  return { items, materialCategories };
}
