/**
 * レシピ素材の id → 名称を引くための参照テーブル。
 * 武器詳細のレシピはアイテム id で保持されるため、表示時に `items` データから
 * 構築したこのテーブルで名称へ解決する。
 */
export interface ItemNameTable {
  /** アイテム id → 日本語名。 */
  readonly items: Readonly<Record<number, string>>;
  /** 素材カテゴリ id → 日本語名。 */
  readonly materialCategories: Readonly<Record<number, string>>;
}

/** アイテム id から日本語名を引く。未登録は `#<id>` にフォールバックする。 */
export function getItemName(table: ItemNameTable, id: number): string {
  return table.items[id] ?? `#${id}`;
}

/** 素材カテゴリ id から日本語名を引く。未登録は `#<id>` にフォールバックする。 */
export function getMaterialCategoryName(table: ItemNameTable, id: number): string {
  return table.materialCategories[id] ?? `#${id}`;
}
