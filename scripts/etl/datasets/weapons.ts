import { getEntryJa } from "../filter.ts";
import { asArray, asNumber, isObject } from "../json.ts";
import { baseTransform } from "../slim.ts";
import type { Dataset, DatasetFile } from "../types.ts";

/** 武器カテゴリが引き受けるトップレベルキー。 */
const WEAPON_KEYS = new Set([
  "great_sword",
  "short_sword",
  "hammer",
  "lance",
  "long_sword",
  "slash_axe",
  "gun_lance",
  "dual_blades",
  "horn",
  "insect_glaive",
  "charge_axe",
  "light_bowgun",
  "heavy_bowgun",
  "bow",
  "horn_melody",
  "horn_melody_mr",
  "hyakuryu_weapon_buildup",
  "weapon_chaos_critical",
]);

interface WeaponTypeConfig {
  /** id struct のキー（例: GreatSword）。 */
  idKey: string;
  /** 近接武器は struct が 1 段深い（base.base.base.atk）。弓・ガンナーは浅い。 */
  deep: boolean;
}

const WEAPON_TYPES: Record<string, WeaponTypeConfig> = {
  great_sword: { idKey: "GreatSword", deep: true },
  long_sword: { idKey: "LongSword", deep: true },
  short_sword: { idKey: "ShortSword", deep: true },
  dual_blades: { idKey: "DualBlades", deep: true },
  hammer: { idKey: "Hammer", deep: true },
  horn: { idKey: "Horn", deep: true },
  lance: { idKey: "Lance", deep: true },
  gun_lance: { idKey: "GunLance", deep: true },
  slash_axe: { idKey: "SlashAxe", deep: true },
  charge_axe: { idKey: "ChargeAxe", deep: true },
  insect_glaive: { idKey: "InsectGlaive", deep: true },
  bow: { idKey: "Bow", deep: false },
  light_bowgun: { idKey: "LightBowgun", deep: false },
  heavy_bowgun: { idKey: "HeavyBowgun", deep: false },
};

/** 名称マスタの name 列（W_<武器種>_<id>_Name、一部 _Name_MR）から武器 id を抽出する。 */
const NAME_RE = /^W_\w+_(\d+)_Name(?:_MR)?$/;
/** 説明文マスタの name 列（W_<武器種>_<id>_Explain）から武器 id を抽出する。 */
const EXPLAIN_RE = /^W_\w+_(\d+)_Explain(?:_MR)?$/;

/**
 * タグ付き union（キーが 1 つだけのオブジェクト）を値へ開く際に認識するキー。
 * 例: `{ GreatSword: 132 }` → 132、`{ Skill: 9 }` → 9、`{ Em: 97 }` → 97。
 */
const TAG_KEYS = new Set<string>([
  ...Object.values(WEAPON_TYPES).map((config) => config.idKey),
  "Skill",
  "Em",
  "LrHr",
  "Mr",
  "Normal",
  "TreeType",
  "VillageProgress",
  "HallProgress",
  "MasterRankProgress",
]);

export const weapons: Dataset = {
  name: "weapons",
  match: (key) => WEAPON_KEYS.has(key),
  transform: (group) => buildFiles(baseTransform(group)),
};

/**
 * 武器カテゴリは武器種ごとにディレクトリを切り、次のファイルを出力する。
 * - `weapons/<武器種>/row`: 元の（ゲーム寄りの）構造。参考・再処理用。
 * - `weapons/<武器種>/index`: 一覧用の軽量インデックス（id / 名前 / レア度 / 攻撃力 / 属性）。
 * - `weapons/<武器種>/<武器 id>`: 武器 1 件ごとの非正規化レコード
 *   （base_data の入れ子をフラット化し、名称・説明・レシピ・派生ツリーを join、enum を正規化済み）。
 */
function buildFiles(group: Record<string, unknown>): DatasetFile[] {
  const files: DatasetFile[] = [];

  for (const [weaponType, config] of Object.entries(WEAPON_TYPES)) {
    const weapon = group[weaponType];
    if (!isObject(weapon)) continue;

    filterWeaponType(weapon, config);
    const data: Record<string, unknown> = { ...weapon };

    const buildup = filterWeaponScoped(group.hyakuryu_weapon_buildup, config.idKey);
    if (buildup) data.hyakuryu_buildup = buildup;

    const chaos = filterWeaponScoped(group.weapon_chaos_critical, config.idKey);
    if (chaos) data.chaos_critical = chaos;

    if (weaponType === "horn") {
      data.melody = group.horn_melody;
      data.melody_mr = group.horn_melody_mr;
    }

    files.push({ id: `weapons/${weaponType}/row`, data });
    files.push({ id: `weapons/${weaponType}/index`, data: buildIndex(data) });
    files.push(...buildDetails(weaponType, data));
  }

  return files;
}

/** 一覧用インデックス（軽量）。武器名ページはこれだけを読む。 */
function buildIndex(data: Record<string, unknown>): unknown[] {
  const names = buildEntryNameMap(data, ["name", "name_mr"], NAME_RE);
  const tree = buildTreeIndex(data);

  const items = weaponRecords(data).flatMap((record) => {
    const id = asNumber(record.id);
    if (id === undefined) return [];
    const name = names.get(id);
    if (name === undefined) return [];
    return [
      {
        id,
        name,
        rarity: asNumber(record.rare_type) ?? 0,
        atk: asNumber(record.atk) ?? 0,
        // 会心率（負値あり）。
        critical_rate: asNumber(record.critical_rate) ?? 0,
        // 属性は武器種ごとに個数が異なる（双剣はメイン + サブの 2 属性）。
        // 将来のスキーマ変更に耐えるよう、固定フィールドではなく配列で持つ。
        elements: weaponElements(record),
        // 切れ味（赤 / 橙 / 黄 / 緑 / 青 / 白 / 紫）。弓・ガンナーは空配列。
        sharpness_val_list: numberList(record.sharpness_val_list),
        // 匠による切れ味上昇分。現状は一覧では未使用（データのみ保持）。
        takumi_val_list: numberList(record.takumi_val_list),
        // 根 → 自身の weapon id パス（表示・親子・インデント用）。
        path: tree.pathById.get(id) ?? [id],
        // 兄弟順ベースの前順ソートキー（既定ソート用）。
        sort: treeSort(tree, id),
      },
    ];
  });

  // 既定は派生ツリーの前順（親 → 子孫、兄弟は next 順）で並べる。
  items.sort((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0));
  return items;
}

/** 武器 1 件ごとの非正規化レコードを生成する。 */
function buildDetails(weaponType: string, data: Record<string, unknown>): DatasetFile[] {
  const names = buildEntryNameMap(data, ["name", "name_mr"], NAME_RE);
  const explains = buildEntryNameMap(data, ["explain", "explain_mr"], EXPLAIN_RE);
  const tree = buildTreeIndex(data);

  const recipes = {
    product: collectRecipes(data, "product"),
    change: collectRecipes(data, "change"),
    process: collectRecipes(data, "process"),
  };
  const hyakuryu = collectScoped(data, "hyakuryu_buildup", "weapon_id");
  const chaos = collectScoped(data, "chaos_critical", "weapon");
  const overwear = buildOverwear(data);

  return weaponRecords(data).flatMap((record) => {
    const id = asNumber(record.id);
    if (id === undefined) return [];
    const node = tree.byWeapon.get(id);

    const detail = {
      ...record,
      name: names.get(id) ?? null,
      description: explains.get(id) ?? null,
      recipes: {
        product: recipes.product.get(id)?.[0] ?? null,
        change: recipes.change.get(id)?.[0] ?? null,
        process: recipes.process.get(id)?.[0] ?? null,
      },
      tree: resolveTree(node, tree.byNode),
      hyakuryu_buildup: hyakuryu.get(id) ?? null,
      chaos_critical: chaos.get(id) ?? null,
      overwear: overwear.get(id) ?? [],
    };

    return [{ id: `weapons/${weaponType}/${id}`, data: detail, listed: false }];
  });
}

interface TreeNodeInfo {
  weaponId: number;
  type: unknown;
  index: number;
  node: Record<string, unknown>;
  /** 親ノードの (type,index) キー。根は null。 */
  parentKey: string | null;
  /** 子ノードの (type,index) キー。next_weapon_index_list の順を保持する。 */
  childKeys: string[];
}

interface TreeIndex {
  /** 武器 id → その武器が属するツリーノード。 */
  byWeapon: Map<number, TreeNodeInfo>;
  /** `(tree_type, index)` の文字列キー → ツリーノード。next / prev の解決に使う。 */
  byNode: Map<string, TreeNodeInfo>;
  /** 武器 id → 根から自身までの weapon id 配列。 */
  pathById: Map<number, number[]>;
  /** 武器 id → 根から自身までの兄弟順（ordinal）配列。 */
  orderById: Map<number, number[]>;
  /** 武器 id → 根の weapon id。 */
  rootById: Map<number, number>;
  /** 根 id のゼロ埋め桁数。 */
  idWidth: number;
  /** 兄弟順のゼロ埋め桁数。 */
  ordinalWidth: number;
}

/**
 * tree テーブルを索引化する。
 * 各ノードの親（prev）と、親から見た子の並び（next_weapon_index_list の順）を保持し、
 * 根から自身までの weapon id パスと兄弟順（ordinal）パスを計算する。
 * ordinal パスを連結した文字列は辞書順で「厳密な前順（pre-order）」になる。
 */
function buildTreeIndex(data: Record<string, unknown>): TreeIndex {
  const byWeapon = new Map<number, TreeNodeInfo>();
  const byNode = new Map<string, TreeNodeInfo>();
  const pathById = new Map<number, number[]>();
  const orderById = new Map<number, number[]>();
  const rootById = new Map<number, number>();
  const container = data.tree;
  if (!isObject(container)) {
    return { byWeapon, byNode, pathById, orderById, rootById, idWidth: 1, ordinalWidth: 1 };
  }

  let maxChildren = 0;
  for (const row of asArray(container.param)) {
    if (!isObject(row)) continue;
    const weaponId = asNumber(normalize(row.weapon_id));
    const index = asNumber(row.index);
    const type = normalize(row.tree_type);
    if (weaponId === undefined || index === undefined || type === null) continue;

    const childKeys: string[] = [];
    const nextTypes = asArray(row.next_weapon_type_list);
    const nextIndexes = asArray(row.next_weapon_index_list);
    for (let i = 0; i < nextIndexes.length; i++) {
      const childType = normalize(nextTypes[i]);
      const childIndex = asNumber(nextIndexes[i]);
      if (childType === null || childIndex === undefined || childIndex < 0) continue;
      childKeys.push(nodeKey(childType, childIndex));
    }

    const prevType = normalize(row.prev_weapon_type);
    const prevIndex = asNumber(row.prev_weapon_index);
    const parentKey =
      prevType !== null && prevIndex !== undefined && prevIndex >= 0
        ? nodeKey(prevType, prevIndex)
        : null;

    const info: TreeNodeInfo = { weaponId, type, index, node: row, parentKey, childKeys };
    byNode.set(nodeKey(type, index), info);
    byWeapon.set(weaponId, info);
    maxChildren = Math.max(maxChildren, childKeys.length);
  }

  let maxWeaponId = 0;
  for (const info of byNode.values()) {
    const path: number[] = [];
    const order: number[] = [];
    let current: TreeNodeInfo | undefined = info;
    const seen = new Set<string>();
    while (current) {
      const key = nodeKey(current.type, current.index);
      if (seen.has(key)) break;
      seen.add(key);
      path.push(current.weaponId);
      const parent: TreeNodeInfo | undefined = current.parentKey
        ? byNode.get(current.parentKey)
        : undefined;
      if (!parent) break;
      const ordinal = parent.childKeys.indexOf(key);
      order.push(ordinal >= 0 ? ordinal : 0);
      current = parent;
    }
    path.reverse();
    order.reverse();
    pathById.set(info.weaponId, path);
    orderById.set(info.weaponId, order);
    rootById.set(info.weaponId, path[0] ?? info.weaponId);
    maxWeaponId = Math.max(maxWeaponId, ...path);
  }

  return {
    byWeapon,
    byNode,
    pathById,
    orderById,
    rootById,
    idWidth: String(Math.max(maxWeaponId, 1)).length,
    ordinalWidth: String(Math.max(maxChildren, 1)).length,
  };
}

/**
 * 武器のツリーソートキー。`pad(根 id) + pad(兄弟順)…` で、
 * 文字列の辞書順がそのまま前順（親 → 子孫、兄弟は next 順）になる。
 */
function treeSort(tree: TreeIndex, weaponId: number): string {
  const root = tree.rootById.get(weaponId);
  const order = tree.orderById.get(weaponId);
  if (root === undefined || order === undefined) return "";
  return pad(root, tree.idWidth) + order.map((ordinal) => pad(ordinal, tree.ordinalWidth)).join("");
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

/** ノードの next / prev（(type,index) 参照）を武器 id へ解決する。 */
function resolveTree(
  node: TreeNodeInfo | undefined,
  byNode: Map<string, TreeNodeInfo>,
): { type: unknown; index: number; prev: number | null; next: number[] } | null {
  if (!node) return null;

  const next: number[] = [];
  const nextTypes = asArray(node.node.next_weapon_type_list);
  const nextIndexes = asArray(node.node.next_weapon_index_list);
  for (let i = 0; i < nextIndexes.length; i++) {
    const type = normalize(nextTypes[i]);
    const index = asNumber(nextIndexes[i]);
    if (type === null || index === undefined || index < 0) continue;
    const child = byNode.get(nodeKey(type, index));
    if (child) next.push(child.weaponId);
  }

  const prevType = normalize(node.node.prev_weapon_type);
  const prevIndex = asNumber(node.node.prev_weapon_index);
  const parent =
    prevType !== null && prevIndex !== undefined && prevIndex >= 0
      ? byNode.get(nodeKey(prevType, prevIndex))
      : undefined;

  return { type: node.type, index: node.index, prev: parent?.weaponId ?? null, next };
}

/** 一覧インデックスに載せる属性 1 件（種類と威力）。 */
interface WeaponElement {
  /** 属性の種類（例: `Fire` / `Water` / `Thunder` / `Ice` / `Dragon` / `Poison` / `Paralyze` / `Sleep` / `Bomb`）。 */
  type: string;
  /** 属性値（威力）。 */
  value: number;
}

/**
 * 武器の属性を配列にまとめる。
 * メイン属性（`main_element_type` / `main_element_val`）を先頭に、サブ属性
 * （`sub_element_type` / `sub_element_val`）があれば続ける（双剣など）。
 * 属性値が 0 のものは無属性として除外する。
 */
function weaponElements(record: Record<string, unknown>): WeaponElement[] {
  const elements: WeaponElement[] = [];
  const fields = [
    ["main_element_type", "main_element_val"],
    ["sub_element_type", "sub_element_val"],
  ] as const;
  for (const [typeKey, valueKey] of fields) {
    const type = record[typeKey];
    const value = asNumber(record[valueKey]) ?? 0;
    if (typeof type === "string" && value > 0) elements.push({ type, value });
  }
  return elements;
}

/** 数値配列を安全に取り出す（非数値は 0、配列以外は空配列）。 */
function numberList(value: unknown): number[] {
  return asArray(value).map((item) => asNumber(item) ?? 0);
}

/**
 * base_data の入れ子（`base` の連鎖）を 1 段のオブジェクトへフラット化する。
 * 近接は 4 段、弓・ガンナーは 3 段と深さが違うが、`base` を辿って全キーを統合する。
 */
function flattenBase(value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let current: unknown = value;
  while (isObject(current)) {
    for (const [key, item] of Object.entries(current)) {
      if (key === "base") continue;
      out[key] = item;
    }
    current = current.base;
  }
  return out;
}

/**
 * enum / センチネルを正規化する。
 * - `"None"` → `null`
 * - タグ付き union（`{ GreatSword: 132 }` 等）→ 値（132）
 * - 配列・オブジェクトは再帰的に適用
 */
function normalize(value: unknown): unknown {
  if (value === "None") return null;
  if (Array.isArray(value)) return value.map((item) => normalize(item));
  if (isObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 1 && TAG_KEYS.has(keys[0])) {
      return normalize(value[keys[0]]);
    }
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) out[key] = normalize(item);
    return out;
  }
  return value;
}

/** base_data の各武器を、フラット化・正規化済みレコードとして列挙する。 */
function weaponRecords(data: Record<string, unknown>): Record<string, unknown>[] {
  const baseData = data.base_data;
  if (!isObject(baseData)) return [];
  const records: Record<string, unknown>[] = [];
  for (const row of asArray(baseData.param)) {
    if (!isObject(row)) continue;
    const record = normalize(flattenBase(row));
    if (isObject(record)) records.push(record);
  }
  return records;
}

/** 生産 / 強化 / 加工レシピを武器 id で索引化する。 */
function collectRecipes(
  data: Record<string, unknown>,
  table: string,
): Map<number, Record<string, unknown>[]> {
  const map = new Map<number, Record<string, unknown>[]>();
  const container = data[table];
  if (!isObject(container)) return map;
  for (const row of asArray(container.param)) {
    if (!isObject(row)) continue;
    const recipe = normalize(flattenBase(row));
    if (!isObject(recipe)) continue;
    const id = asNumber(recipe.id);
    if (id === undefined) continue;
    const list = map.get(id) ?? [];
    list.push(recipe);
    map.set(id, list);
  }
  return map;
}

/** 武器 id を 1 フィールドに持つ補助テーブル（百竜強化・混沌会心）を索引化する。 */
function collectScoped(
  data: Record<string, unknown>,
  table: string,
  idField: string,
): Map<number, Record<string, unknown>> {
  const map = new Map<number, Record<string, unknown>>();
  const container = data[table];
  if (!isObject(container)) return map;
  for (const row of asArray(container.param)) {
    if (!isObject(row)) continue;
    const flat = normalize(row);
    if (!isObject(flat)) continue;
    const id = asNumber(flat[idField]);
    if (id === undefined) continue;
    map.set(id, flat);
  }
  return map;
}

/** 重ね着武器を「元武器 id → 重ね着一覧」で索引化する（対応する生産レシピも join）。 */
function buildOverwear(data: Record<string, unknown>): Map<number, Record<string, unknown>[]> {
  const products = new Map<number, Record<string, unknown>>();
  const productContainer = data.overwear_product;
  if (isObject(productContainer)) {
    for (const row of asArray(productContainer.param)) {
      if (!isObject(row)) continue;
      const flat = normalize(row);
      if (!isObject(flat)) continue;
      const id = asNumber(flat.id);
      if (id !== undefined) products.set(id, flat);
    }
  }

  const map = new Map<number, Record<string, unknown>[]>();
  const container = data.overwear;
  if (!isObject(container)) return map;
  for (const row of asArray(container.param)) {
    if (!isObject(row)) continue;
    const flat = normalize(row);
    if (!isObject(flat)) continue;
    const weaponId = asNumber(flat.relative_id);
    if (weaponId === undefined) continue;
    const overwearId = asNumber(flat.id);
    const product = overwearId !== undefined ? products.get(overwearId) : undefined;
    const list = map.get(weaponId) ?? [];
    list.push(product ? { ...flat, product } : flat);
    map.set(weaponId, list);
  }
  return map;
}

/** 名称 / 説明マスタから id → 日本語名を索引化する。 */
function buildEntryNameMap(
  data: Record<string, unknown>,
  keys: readonly string[],
  pattern: RegExp,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const key of keys) {
    const container = data[key];
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

/** (tree_type, index) を文字列キーに変換する。 */
function nodeKey(type: unknown, index: number): string {
  return `${String(type)}|${index}`;
}

/**
 * 派生ツリー（tree）に登録された武器だけを残す。
 * tree はゲームが「実在武器」として扱う id の正解集合で、テスト武器
 * （`カスタムT*` / `MR*テスト用` 等）や重ね着専用ダミー（ロストコード／ぬいぐるみ系）は
 * ここに含まれない。名称・説明マスタも残した id に絞る。
 * 派生ツリー（tree）・生産素材（product）はインデックス参照があるため温存する。
 */
function filterWeaponType(weapon: Record<string, unknown>, config: WeaponTypeConfig): void {
  if (!isObject(weapon.base_data)) return;

  const keptIds = treeWeaponIds(weapon, config);
  // tree が無い／空の場合はデータを失わないよう何もしない（安全側）。
  if (keptIds.size === 0) return;

  const baseData = weapon.base_data;
  baseData.param = asArray(baseData.param).filter((row) => {
    const id = getWeaponId(row, config);
    return id !== undefined && keptIds.has(id);
  });

  filterEntryTable(weapon.name, keptIds, NAME_RE);
  filterEntryTable(weapon.name_mr, keptIds, NAME_RE);
  filterEntryTable(weapon.explain, keptIds, EXPLAIN_RE);
  filterEntryTable(weapon.explain_mr, keptIds, EXPLAIN_RE);
}

/** 派生ツリー（tree）に登録された武器 id を「実在武器」の正解集合として集める。 */
function treeWeaponIds(weapon: Record<string, unknown>, config: WeaponTypeConfig): Set<number> {
  const ids = new Set<number>();
  const tree = weapon.tree;
  if (!isObject(tree)) return ids;
  for (const row of asArray(tree.param)) {
    if (!isObject(row)) continue;
    const idStruct = isObject(row.weapon_id) ? row.weapon_id : undefined;
    const id = idStruct ? asNumber(idStruct[config.idKey]) : undefined;
    if (id !== undefined) ids.add(id);
  }
  return ids;
}

/**
 * 武器単位の補助データ（百竜強化・混沌会心）を武器種で絞る。
 * 各要素の weapon_id / weapon struct に該当武器種のキーが含まれるかで判定する。
 */
function filterWeaponScoped(
  container: unknown,
  idKey: string,
): Record<string, unknown> | undefined {
  if (!isObject(container)) return undefined;
  const param = asArray(container.param).filter((row) => {
    if (!isObject(row)) return false;
    return Object.values(row).some((value) => isObject(value) && idKey in value);
  });
  return { ...container, param };
}

/** 名称・説明テーブルを、残した武器 id のみに絞る（未使用枠もここで落ちる）。 */
function filterEntryTable(container: unknown, keptIds: Set<number>, pattern: RegExp): void {
  if (!isObject(container)) return;
  container.entries = asArray(container.entries).filter((entry) => {
    if (!isObject(entry) || typeof entry.name !== "string") return false;
    const match = pattern.exec(entry.name);
    return match !== null && keptIds.has(Number(match[1]));
  });
}

function getWeaponStats(
  row: unknown,
  config: WeaponTypeConfig,
): Record<string, unknown> | undefined {
  const base1 = isObject(row) ? row.base : undefined;
  const base2 = isObject(base1) ? base1.base : undefined;
  if (!config.deep) return isObject(base2) ? base2 : undefined;
  const base3 = isObject(base2) ? base2.base : undefined;
  return isObject(base3) ? base3 : undefined;
}

function getWeaponId(row: unknown, config: WeaponTypeConfig): number | undefined {
  const stats = getWeaponStats(row, config);
  const ids = stats && isObject(stats.base) ? stats.base : undefined;
  const idStruct = ids && isObject(ids.id) ? ids.id : undefined;
  return idStruct ? asNumber(idStruct[config.idKey]) : undefined;
}
