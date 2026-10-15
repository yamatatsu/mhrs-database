import { cleanTags, getEntryJa } from "../filter.ts";
import { asArray, asNumber, asString, isObject } from "../json.ts";
import { baseTransform } from "../slim.ts";
import type { Dataset, DatasetFile } from "../types.ts";

/** アイテムカテゴリが引き受けるトップレベルキーの接頭辞。 */
const ITEMS_PREFIXES = ["items", "material_category", "item_", "insect"];

/** 名称マスタ（`I_<id>_Name` / `I_<id>_Name_MR`）からアイテム id を抽出する。 */
const ITEM_NAME_RE = /^I_(\d+)_Name(?:_MR)?$/;
/** 説明マスタ（`I_<id>_Explain` / `I_<id>_Explain_MR`）からアイテム id を抽出する。 */
const ITEM_EXPLAIN_RE = /^I_(\d+)_Explain(?:_MR)?$/;
/** 素材カテゴリ名マスタ（`ICT_Name_<id>` / `ICT_Name_<id>_MR`）からカテゴリ id を抽出する。 */
const MATERIAL_CATEGORY_NAME_RE = /^ICT_Name_(\d+)(?:_MR)?$/;
const EMPTY_NAMES = new Set(["", "なし", "None"]);

/** `type_` の表示名。未知の種別は生の値をそのまま表示する。 */
const TYPE_LABELS: Record<string, string> = {
  Material: "素材",
  OffcutsMaterial: "端材",
  Antique: "骨董品",
  PayOff: "換金",
  CarryPayOff: "運搬",
  Consume: "消耗品",
  Bullet: "弾",
  Bottle: "ビン",
  Tool: "道具",
};

/**
 * アイテムカテゴリは武器・モンスターと同じく 3 種のファイルを出力する。
 * - `items/row`: 元の（ゲーム寄りの）構造。参考・再処理・武器の素材名解決用。
 * - `items/index`: 一覧用の軽量インデックス（図鑑順）。
 * - `items/<id>`: アイテム 1 件ごとの詳細（名称・説明・調合・購入条件を join）。
 */
export const items: Dataset = {
  name: "items",
  match: (key) => ITEMS_PREFIXES.some((prefix) => key.startsWith(prefix)),
  transform: (group) => buildFiles(baseTransform(group)),
};

/** 調合レシピ（`item_mix` の 1 件を id ベースに正規化したもの）。 */
interface Recipe {
  /** 材料のアイテム id（1〜2 個）。 */
  readonly ingredients: readonly number[];
  /** 完成品のアイテム id。 */
  readonly product: number;
  /** 完成品の個数。 */
  readonly num: number;
}

/** 雑貨屋の購入条件（`item_shop` の 1 件）。未到達の進度は `null`。 */
interface ShopEntry {
  readonly village: number | null;
  readonly hall: number | null;
  readonly mr: number | null;
}

/** 詳細・一覧の生成に使う索引。名称・説明・素材カテゴリ・調合・購入をまとめる。 */
interface ItemContext {
  readonly names: Map<number, string>;
  readonly explains: Map<number, string>;
  readonly categories: Map<number, string>;
  readonly recipes: readonly Recipe[];
  readonly shops: Map<number, ShopEntry>;
}

function buildFiles(group: Record<string, unknown>): DatasetFile[] {
  filterItems(group);
  const context = buildContext(group);
  return [
    { id: "items/row", data: group },
    { id: "items/index", data: buildIndex(group, context) },
    ...buildDetails(group, context),
  ];
}

/** 名称・説明・素材カテゴリ・調合・購入の索引を構築する。 */
function buildContext(group: Record<string, unknown>): ItemContext {
  return {
    names: buildNameMap(group),
    explains: buildExplainMap(group),
    categories: buildCategoryMap(group),
    recipes: buildRecipes(group),
    shops: buildShopMap(group),
  };
}

/** 一覧用インデックス（軽量）。名前・レア度・分類・価格・所持上限・調合可否のみ。 */
function buildIndex(group: Record<string, unknown>, context: ItemContext): unknown[] {
  const craftable = new Set(context.recipes.map((recipe) => recipe.product));
  const sortById = new Map<number, number>();

  const entries = itemRows(group).flatMap((row) => {
    const id = firstNumber(row.id);
    if (id === undefined) return [];
    const name = context.names.get(id);
    if (name === undefined) return [];
    sortById.set(id, asNumber(row.sort_id) ?? 0);
    return [
      {
        id,
        name,
        rare: asNumber(row.rare) ?? 0,
        type: typeLabel(row.type_),
        pl_max_count: asNumber(row.pl_max_count) ?? 0,
        sell_price: asNumber(row.sell_price) ?? 0,
        buy_price: asNumber(row.buy_price) ?? 0,
        craftable: craftable.has(id),
      },
    ];
  });

  // 図鑑の並び（sort_id 昇順）に整える。同値は id で安定化する。
  entries.sort((a, b) => (sortById.get(a.id) ?? 0) - (sortById.get(b.id) ?? 0) || a.id - b.id);
  return entries;
}

/** アイテム 1 件ごとの詳細を生成する。 */
function buildDetails(group: Record<string, unknown>, context: ItemContext): DatasetFile[] {
  const productRecipes = groupBy(context.recipes, (recipe) => recipe.product);
  const ingredientRecipes = groupBy(
    context.recipes.flatMap((recipe) => recipe.ingredients.map((id) => ({ id, recipe }))),
    (entry) => entry.id,
  );

  return itemRows(group).flatMap((row) => {
    const id = firstNumber(row.id);
    if (id === undefined) return [];
    const name = context.names.get(id);
    if (name === undefined) return [];

    const detail = {
      id,
      name,
      rare: asNumber(row.rare) ?? 0,
      type: typeLabel(row.type_),
      pl_max_count: asNumber(row.pl_max_count) ?? 0,
      sell_price: asNumber(row.sell_price) ?? 0,
      buy_price: asNumber(row.buy_price) ?? 0,
      material_categories: categoryNames(row, context),
      description: context.explains.get(id) ?? null,
      mix_as_product: (productRecipes.get(id) ?? []).map((recipe) => ({
        ingredients: recipe.ingredients.map((ingredient) => resolveName(context, ingredient)),
        num: recipe.num,
      })),
      mix_as_ingredient: (ingredientRecipes.get(id) ?? []).map(({ recipe }) => ({
        with: recipe.ingredients
          .filter((ingredient) => ingredient !== id)
          .map((ingredient) => resolveName(context, ingredient)),
        result: resolveName(context, recipe.product),
        num: recipe.num,
      })),
      shop: context.shops.get(id) ?? null,
    };

    return [{ id: `items/${id}`, data: detail, listed: false }];
  });
}

/** 名称を持たない内部行・「なし」を除外する。 */
function filterItems(group: Record<string, unknown>): void {
  const nameMap = buildNameMap(group);
  const keptIds = new Set<number>();

  const itemsContainer = group.items;
  if (isObject(itemsContainer)) {
    itemsContainer.param = asArray(itemsContainer.param).filter((row) => {
      const id = firstNumber(isObject(row) ? row.id : undefined);
      if (id === undefined) return false;
      const name = nameMap.get(id);
      if (name === undefined || EMPTY_NAMES.has(name.trim())) return false;
      keptIds.add(id);
      return true;
    });
  }

  filterNameEntries(group.items_name_msg, keptIds);
  filterNameEntries(group.items_name_msg_mr, keptIds);
}

/** `items_name_msg` / `items_name_msg_mr` からアイテム id → 日本語名を索引化する。 */
function buildNameMap(group: Record<string, unknown>): Map<number, string> {
  return entryMap(group, ["items_name_msg", "items_name_msg_mr"], ITEM_NAME_RE);
}

/** `items_explain_msg` / `items_explain_msg_mr` からアイテム id → 説明文を索引化する。 */
function buildExplainMap(group: Record<string, unknown>): Map<number, string> {
  const map = entryMap(group, ["items_explain_msg", "items_explain_msg_mr"], ITEM_EXPLAIN_RE);
  for (const [id, text] of map) map.set(id, cleanTags(text));
  return map;
}

/** `material_category_msg` から素材カテゴリ id → 日本語名を索引化する。 */
function buildCategoryMap(group: Record<string, unknown>): Map<number, string> {
  return entryMap(
    group,
    ["material_category_msg", "material_category_msg_mr"],
    MATERIAL_CATEGORY_NAME_RE,
  );
}

/** 名称マスタ群（`{ entries: [{ name, content }] }`）から id → 日本語名を集める。 */
function entryMap(
  group: Record<string, unknown>,
  keys: readonly string[],
  pattern: RegExp,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const key of keys) {
    const container = group[key];
    if (!isObject(container)) continue;
    for (const entry of asArray(container.entries)) {
      if (!isObject(entry) || typeof entry.name !== "string") continue;
      const match = pattern.exec(entry.name);
      if (!match) continue;
      const ja = getEntryJa(entry);
      if (ja !== undefined) map.set(Number(match[1]), ja);
    }
  }
  return map;
}

/** `item_mix` から調合レシピを id ベースに正規化する。 */
function buildRecipes(group: Record<string, unknown>): Recipe[] {
  const container = group.item_mix;
  if (!isObject(container)) return [];

  return asArray(container.param).flatMap((row) => {
    if (!isObject(row)) return [];
    const product = firstNumber(row.generated_item_id);
    if (product === undefined) return [];
    const ingredients = asArray(row.item_id_list)
      .map(firstNumber)
      .filter((id): id is number => id !== undefined);
    return [
      {
        ingredients,
        product,
        num: asNumber(row.generated_item_num) ?? 1,
      },
    ];
  });
}

/** `item_shop` からアイテム id → 購入条件を索引化する。 */
function buildShopMap(group: Record<string, unknown>): Map<number, ShopEntry> {
  const map = new Map<number, ShopEntry>();
  const container = group.item_shop;
  if (!isObject(container)) return map;

  for (const row of asArray(container.param)) {
    if (!isObject(row)) continue;
    const id = firstNumber(row.id);
    if (id === undefined || map.has(id)) continue;
    map.set(id, {
      village: firstNumber(row.village_progress) ?? null,
      hall: firstNumber(row.hall_progress) ?? null,
      mr: firstNumber(row.mr_progress) ?? null,
    });
  }
  return map;
}

/**
 * `material_category` を素材カテゴリ名へ解決する。
 *
 * 各スロットはタグ付き union で、タグがランク帯・値がカテゴリの相対位置を表す。
 * 名称マスタの id との対応は実データで確認した次の規則に従う（例: `{ LrHr: 1 }`
 * = 鉄鉱石 → `ICT_Name_02` 鉱石素材、`{ Mr: 73 }` = 傀異化した骨 → `ICT_Name_273`）。
 * - `{ LrHr: v }` → `material_category_msg` の `ICT_Name_<v + 1>`
 * - `{ Mr: v }` → `material_category_msg_mr` の `ICT_Name_<v + 200>`
 */
function categoryNames(row: Record<string, unknown>, context: ItemContext): string[] {
  const names: string[] = [];
  for (const slot of asArray(row.material_category)) {
    if (!isObject(slot)) continue;
    for (const [tag, value] of Object.entries(slot)) {
      if (typeof value !== "number") continue;
      const id = tag === "Mr" ? value + 200 : value + 1;
      const name = context.categories.get(id);
      if (name !== undefined && !names.includes(name)) names.push(name);
    }
  }
  return names;
}

function filterNameEntries(container: unknown, keptIds: Set<number>): void {
  if (!isObject(container)) return;
  container.entries = asArray(container.entries).filter((entry) => {
    if (!isObject(entry) || typeof entry.name !== "string") return false;
    const match = ITEM_NAME_RE.exec(entry.name);
    return match !== null && keptIds.has(Number(match[1]));
  });
}

/** `data.items.param` の各レコードを列挙する（フィルタ後）。 */
function itemRows(group: Record<string, unknown>): Record<string, unknown>[] {
  const container = group.items;
  if (!isObject(container)) return [];
  return asArray(container.param).filter(isObject);
}

/** `type_` を表示名へ解決する。未知の種別は生の表記にフォールバックする。 */
function typeLabel(value: unknown): string {
  const raw = asString(value);
  if (raw === undefined) return "—";
  return TYPE_LABELS[raw] ?? raw;
}

/** アイテム id から日本語名を引く。未登録は `#<id>` にフォールバックする。 */
function resolveName(context: ItemContext, id: number): string {
  return context.names.get(id) ?? `#${id}`;
}

/**
 * タグ付き union（キーが 1 つだけのオブジェクト）や数値から数値を取り出す。
 * 例: `{ Normal: 519 }` → 519、`{ VillageProgress: 0 }` → 0。
 */
function firstNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (!isObject(value)) return undefined;
  for (const item of Object.values(value)) {
    if (typeof item === "number") return item;
  }
  return undefined;
}

/** キー関数の結果ごとに要素をまとめる。 */
function groupBy<T, K>(items: readonly T[], keyOf: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const list = map.get(key);
    if (list) {
      list.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}
