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
/** モンスター名マスタ（`EnemyIndex<enemy_type>` / `_MR`）から enemy_type を抽出する。 */
const MONSTER_NAME_RE = /^EnemyIndex(\d+)(?:_MR)?$/;
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

/** ランク。表示・並び順に使う。 */
type Rank = "Low" | "High" | "Master";
const RANKS: readonly Rank[] = ["Low", "High", "Master"];
const RANK_ORDER: Record<string, number> = { Low: 0, High: 1, Master: 2 };
/** ランク → `item_pop_lot` の下位/上位/MR カラム接頭辞。 */
const TIER_KEYS: Record<Rank, string> = { Low: "lower", High: "upper", Master: "master" };

/**
 * モンスター報酬として表示する種別（ハンターノートの報酬タブと同じ 5 種）。
 * `otomo_reward` は対応する表示名が無く用途が不明なため対象外とする。
 */
const REWARD_KINDS = ["target", "capture", "parts_break", "hagitory", "drop"] as const;

/** モンスター報酬テーブル（下位・上位 / MR）。 */
const MONSTER_LOT_KEYS = ["monster_lot", "monster_lot_mr"] as const;

/**
 * `map_no` → 表示名。下位・上位マップは `map_name`（`Stage_Name_<map_no>`）から引く。
 * MR マップ（12〜15）は `map_name` に対応が無いため固定表を使う
 * （12=密林 / 13=城塞高地 / 14=塔の秘境 / 15=淵劫の奈落 はクエスト名から確認済み）。
 */
const MR_MAP_NAMES: Record<number, string> = {
  12: "密林",
  13: "城塞高地",
  14: "塔の秘境",
  15: "淵劫の奈落",
};

/**
 * アイテムカテゴリは武器・モンスターと同じく 3 種のファイルを出力する。
 * - `items/row`: 元の（ゲーム寄りの）構造。参考・再処理・武器の素材名解決用。
 * - `items/index`: 一覧用の軽量インデックス（図鑑順）。
 * - `items/<id>`: アイテム 1 件ごとの詳細（名称・説明・調合・購入・入手方法を join）。
 */
export const items: Dataset = {
  name: "items",
  match: (key) => ITEMS_PREFIXES.some((prefix) => key.startsWith(prefix)),
  transform: (group, raw) => buildFiles(baseTransform(group), raw),
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

/** モンスター報酬の 1 グループ（1 モンスター × 1 ランク）を組み立てる途中の値。 */
interface MonsterRewardGroup {
  readonly monsterId: number;
  readonly monsterName: string;
  readonly linkable: boolean;
  readonly rank: string;
  readonly rewards: { kind: string; num: number; probability: number }[];
  /** 並び替え用（最大確率）。出力には含めない。 */
  maxProbability: number;
}

/** フィールド採取の 1 地点グループ（1 ランク × 1 マップ）を組み立てる途中の値。 */
interface GatherGroup {
  readonly rank: string;
  readonly mapNo: number;
  readonly map: string;
  readonly probabilities: Set<number>;
}

/** 入手方法（モンスター報酬 / フィールド採取）を item id で引ける形にまとめたもの。 */
interface ItemSources {
  readonly monsterRewards: Map<number, unknown[]>;
  readonly gather: Map<number, unknown[]>;
}

function buildFiles(group: Record<string, unknown>, raw: Record<string, unknown>): DatasetFile[] {
  filterItems(group);
  const context = buildContext(group);
  const sources = buildSources(raw);
  return [
    { id: "items/row", data: group },
    { id: "items/index", data: buildIndex(group, context) },
    ...buildDetails(group, context, sources),
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
function buildDetails(
  group: Record<string, unknown>,
  context: ItemContext,
  sources: ItemSources,
): DatasetFile[] {
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
      monster_rewards: sources.monsterRewards.get(id) ?? [],
      gather_sources: sources.gather.get(id) ?? [],
    };

    return [{ id: `items/${id}`, data: detail, listed: false }];
  });
}

/** 入手方法（モンスター報酬 / フィールド採取）を item id で引ける形に構築する。 */
function buildSources(raw: Record<string, unknown>): ItemSources {
  return {
    monsterRewards: buildMonsterRewards(raw),
    gather: buildGatherSources(raw),
  };
}

/**
 * モンスター報酬の逆引き。`monster_lot` / `monster_lot_mr` を走査し、
 * item id → [{ monster_id, monster_name, linkable, rank, rewards }] を作る。
 */
function buildMonsterRewards(raw: Record<string, unknown>): Map<number, unknown[]> {
  const monsters = monsterInfoByEm(raw);
  const groups = new Map<number, Map<string, MonsterRewardGroup>>();

  for (const key of MONSTER_LOT_KEYS) {
    const container = raw[key];
    if (!isObject(container)) continue;
    for (const row of asArray(container.param)) {
      if (!isObject(row)) continue;
      const monsterId = firstNumber(row.em_types);
      if (monsterId === undefined) continue;
      const info = monsters.get(monsterId);
      if (info === undefined) continue;
      const rank = asString(row.quest_rank);
      if (rank === undefined || !(rank in RANK_ORDER)) continue;

      const groupKey = `${monsterId}:${rank}`;
      for (const kind of REWARD_KINDS) {
        const ids = asArray(row[`${kind}_reward_item_id_list`]);
        const nums = asArray(row[`${kind}_reward_num_list`]);
        const probs = asArray(row[`${kind}_reward_probability_list`]);
        ids.forEach((value, index) => {
          const itemId = firstNumber(value);
          if (itemId === undefined) return;
          const probability = asNumber(probs[index]) ?? 0;
          const byMonster = groups.get(itemId) ?? new Map<string, MonsterRewardGroup>();
          groups.set(itemId, byMonster);
          const group = byMonster.get(groupKey) ?? {
            monsterId,
            monsterName: info.name,
            linkable: info.linkable,
            rank,
            rewards: [],
            maxProbability: 0,
          };
          group.rewards.push({ kind, num: asNumber(nums[index]) ?? 0, probability });
          group.maxProbability = Math.max(group.maxProbability, probability);
          byMonster.set(groupKey, group);
        });
      }
    }
  }

  const out = new Map<number, unknown[]>();
  for (const [itemId, byMonster] of groups) {
    const list = [...byMonster.values()].sort(
      (a, b) =>
        RANK_ORDER[a.rank] - RANK_ORDER[b.rank] ||
        b.maxProbability - a.maxProbability ||
        a.monsterName.localeCompare(b.monsterName, "ja"),
    );
    out.set(
      itemId,
      list.map((group) => ({
        monster_id: group.monsterId,
        monster_name: group.monsterName,
        linkable: group.linkable,
        rank: group.rank,
        rewards: group.rewards,
      })),
    );
  }
  return out;
}

/** Em id → { 名前, 詳細ページ有無 }。大型は `monsters`、小型は `small_monsters` から引く。 */
function monsterInfoByEm(
  raw: Record<string, unknown>,
): Map<number, { name: string; linkable: boolean }> {
  const names = entryMap(raw, ["monster_names", "monster_names_mr"], MONSTER_NAME_RE);
  const map = new Map<number, { name: string; linkable: boolean }>();

  const add = (records: unknown, linkable: boolean): void => {
    for (const record of asArray(records)) {
      if (!isObject(record)) continue;
      const em = firstNumber(record.em_type);
      const enemyType = asNumber(record.enemy_type);
      if (em === undefined || enemyType === undefined) continue;
      const name = names.get(enemyType);
      if (name === undefined || map.has(em)) continue;
      map.set(em, { name, linkable });
    }
  };

  // 大型モンスターは詳細ページがある。小型は名前のみ（リンクしない）。
  add(raw.monsters, true);
  add(raw.small_monsters, false);
  return map;
}

/**
 * フィールド採取の逆引き。`item_pop_lot`（pop_id × field_type ごとの抽選）と
 * `maps`（各マップが置く採取ポイントの pop_id）を突き合わせ、
 * item id → [{ rank, map, probabilities }] を作る。
 */
function buildGatherSources(raw: Record<string, unknown>): Map<number, unknown[]> {
  const mapNames = buildMapNames(raw);
  const lots = popLotsByPopId(raw);
  const popMaps = popMapsByPopId(raw);
  const acc = new Map<number, Map<string, GatherGroup>>();

  for (const [popId, variants] of lots) {
    const maps = popMaps.get(popId);
    if (maps === undefined) continue;
    for (const mapNo of maps) {
      const map = mapNames.get(mapNo);
      if (map === undefined) continue;
      // マップ固有の抽選（field_type = map_no）があればそれを、無ければ既定（-1）を使う。
      const row = variants.get(mapNo) ?? variants.get(-1);
      if (row === undefined) continue;

      for (const rank of RANKS) {
        const tier = TIER_KEYS[rank];
        const ids = asArray(row[`${tier}_id`]);
        const probs = asArray(row[`${tier}_probability`]);
        ids.forEach((value, index) => {
          const itemId = firstNumber(value);
          if (itemId === undefined) return;
          const groupKey = `${rank}:${mapNo}`;
          const byMap = acc.get(itemId) ?? new Map<string, GatherGroup>();
          acc.set(itemId, byMap);
          const group = byMap.get(groupKey) ?? {
            rank,
            mapNo,
            map,
            probabilities: new Set<number>(),
          };
          group.probabilities.add(asNumber(probs[index]) ?? 0);
          byMap.set(groupKey, group);
        });
      }
    }
  }

  const out = new Map<number, unknown[]>();
  for (const [itemId, byMap] of acc) {
    const list = [...byMap.values()].sort(
      (a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank] || a.mapNo - b.mapNo,
    );
    out.set(
      itemId,
      list.map((group) => ({
        rank: group.rank,
        map: group.map,
        probabilities: [...group.probabilities].sort((a, b) => b - a),
      })),
    );
  }
  return out;
}

/** `item_pop_lot` を pop_id → field_type → 行 に索引化する。 */
function popLotsByPopId(
  raw: Record<string, unknown>,
): Map<number, Map<number, Record<string, unknown>>> {
  const map = new Map<number, Map<number, Record<string, unknown>>>();
  const container = raw.item_pop_lot;
  if (!isObject(container)) return map;
  for (const row of asArray(container.param)) {
    if (!isObject(row)) continue;
    const popId = asNumber(row.pop_id);
    const fieldType = asNumber(row.field_type);
    if (popId === undefined || fieldType === undefined) continue;
    const variants = map.get(popId) ?? new Map<number, Record<string, unknown>>();
    map.set(popId, variants);
    variants.set(fieldType, row);
  }
  return map;
}

/** `maps` を pop_id → その pop_id を置く map_no の集合 に索引化する。 */
function popMapsByPopId(raw: Record<string, unknown>): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>();
  const maps = raw.maps;
  if (!isObject(maps)) return map;
  for (const [key, value] of Object.entries(maps)) {
    const mapNo = Number(key);
    if (!Number.isInteger(mapNo) || !isObject(value)) continue;
    for (const pop of asArray(value.pops)) {
      if (!isObject(pop) || !isObject(pop.kind)) continue;
      const item = pop.kind.Item;
      if (!isObject(item) || !isObject(item.behavior)) continue;
      const popId = asNumber(item.behavior.pop_id);
      if (popId === undefined) continue;
      const set = map.get(popId) ?? new Set<number>();
      map.set(popId, set);
      set.add(mapNo);
    }
  }
  return map;
}

/** `map_name` と MR 固定表から map_no → 表示名を構築する。 */
function buildMapNames(raw: Record<string, unknown>): Map<number, string> {
  const map = new Map<number, string>();
  const container = raw.map_name;
  if (isObject(container)) {
    for (const entry of asArray(container.entries)) {
      if (!isObject(entry) || typeof entry.name !== "string") continue;
      const match = /^Stage_Name_(\d+)$/.exec(entry.name);
      if (!match) continue;
      const ja = getEntryJa(entry);
      if (ja === undefined) continue;
      const name = cleanTags(ja).trim();
      if (name === "" || name.includes("#Rejected#")) continue;
      map.set(Number(match[1]), name);
    }
  }
  for (const [id, name] of Object.entries(MR_MAP_NAMES)) map.set(Number(id), name);
  return map;
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
