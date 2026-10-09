import { getEntryJa } from "../filter.ts";
import { asArray, asNumber, isObject } from "../json.ts";
import { baseTransform } from "../slim.ts";
import type { Dataset } from "../types.ts";

/** アイテムカテゴリが引き受けるトップレベルキーの接頭辞。 */
const ITEMS_PREFIXES = ["items", "material_category", "item_", "insect"];

const ITEM_NAME_RE = /^I_(\d+)_Name(?:_MR)?$/;
const EMPTY_NAMES = new Set(["", "なし", "None"]);

export const items: Dataset = {
  name: "items",
  match: (key) => ITEMS_PREFIXES.some((prefix) => key.startsWith(prefix)),
  transform: (group) => filterItems(baseTransform(group)),
};

/**
 * 名称を持たない内部行・「なし」を除外する。
 * #Rejected# は baseTransform で除去済みのため、名称が引けない行は内部行とみなす。
 */
function filterItems(group: Record<string, unknown>): Record<string, unknown> {
  const nameMap = buildItemNameMap(group);
  const keptIds = new Set<number>();

  const itemsContainer = group.items;
  if (isObject(itemsContainer)) {
    itemsContainer.param = asArray(itemsContainer.param).filter((row) => {
      const id = getItemId(row);
      if (id === undefined) return false;
      const name = nameMap.get(id);
      if (name === undefined || EMPTY_NAMES.has(name.trim())) return false;
      keptIds.add(id);
      return true;
    });
  }

  filterNameEntries(group.items_name_msg, keptIds);
  filterNameEntries(group.items_name_msg_mr, keptIds);
  return group;
}

function buildItemNameMap(group: Record<string, unknown>): Map<number, string> {
  const map = new Map<number, string>();
  for (const key of ["items_name_msg", "items_name_msg_mr"]) {
    const container = group[key];
    if (!isObject(container)) continue;
    for (const entry of asArray(container.entries)) {
      if (!isObject(entry) || typeof entry.name !== "string") continue;
      const match = ITEM_NAME_RE.exec(entry.name);
      if (!match) continue;
      const ja = getEntryJa(entry);
      if (ja !== undefined) map.set(Number(match[1]), ja);
    }
  }
  return map;
}

function getItemId(row: unknown): number | undefined {
  if (!isObject(row) || !isObject(row.id)) return undefined;
  for (const value of Object.values(row.id)) {
    const id = asNumber(value);
    if (id !== undefined) return id;
  }
  return undefined;
}

function filterNameEntries(container: unknown, keptIds: Set<number>): void {
  if (!isObject(container)) return;
  container.entries = asArray(container.entries).filter((entry) => {
    if (!isObject(entry) || typeof entry.name !== "string") return false;
    const match = ITEM_NAME_RE.exec(entry.name);
    return match !== null && keptIds.has(Number(match[1]));
  });
}
