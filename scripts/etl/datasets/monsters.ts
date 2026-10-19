import { cleanTags, getEntryJa } from "../filter.ts";
import { asArray, asNumber, isObject } from "../json.ts";
import { baseTransform } from "../slim.ts";
import type { Dataset, DatasetFile } from "../types.ts";

/** モンスターカテゴリが引き受けるトップレベルキーの接頭辞。 */
const MONSTER_PREFIXES = [
  "monster",
  "small_monsters",
  "condition_preset",
  "parts_type",
  "hunter_note",
  "species",
  "enemy_rank",
  "random_scale",
  "size_list",
  "discover_em_set_data",
];

/** 名称マスタ（EnemyIndex000 / EnemyIndex093_MR）から enemy_type を抽出する。 */
const NAME_RE = /^EnemyIndex(\d+)(?:_MR)?$/;
/** 異名マスタ（Alias_EnemyIndex000 / Alias_EnemyIndex093_MR）から enemy_type を抽出する。 */
const ALIAS_RE = /^Alias_EnemyIndex(\d+)(?:_MR)?$/;
/** 図鑑説明マスタ（HN_MonsterListMsg_EnemyIndex000_page1 / …_MR_page1）から enemy_type とページ番号を抽出する。 */
const EXPLAIN_RE = /^HN_MonsterListMsg_EnemyIndex(\d+)(?:_MR)?_page(\d+)$/;

/**
 * 種族（`family_type`）の表示名。`monster_list` は通常種を `Species`、
 * MR 追加種を `MrSpecies` で持つため、両方を解決する。
 * 対応するモンスターから逆引きして確定した（例: Species 2 = ラージャン = 牙獣種）。
 */
const FAMILY_LABELS: Record<string, string> = {
  "Species:1": "海竜種",
  "Species:2": "牙獣種",
  "Species:3": "牙竜種",
  "Species:4": "魚竜種",
  "Species:5": "甲殻種",
  "Species:8": "獣竜種",
  "Species:9": "鳥竜種",
  "Species:10": "飛竜種",
  "Species:11": "古龍種",
  "Species:12": "両生種",
  "Species:13": "鋏角種",
  // ゴア・マガラ系（古龍種）は MrSpecies で保持される。
  "MrSpecies:0": "古龍種",
};

/**
 * 状態異常耐性一覧（`monsters/resistances`）に載せる状態異常のキー。
 * 値は共有プリセット表（`condition_preset`）で解決済み（§6.6）。
 */
const RESISTANCE_KEYS = [
  "paralyze_data",
  "sleep_data",
  "stun_data",
  "stamina_data",
  "poison_data",
  "blast_data",
] as const;

/**
 * モンスターカテゴリは武器と同じく、一覧用の軽量インデックスと
 * モンスター 1 体ごとの詳細ファイルを出力する。
 * - `monsters/row`: 元の（ゲーム寄りの）構造。参考・再処理用。
 * - `monsters/index`: 一覧用の軽量インデックス（名前・異名・種族・危険度・サイズ）。
 * - `monsters/resistances`: 状態異常耐性の一覧（状態異常ごとの初期耐性・上昇・最大）。
 * - `monsters/<em>`: モンスター 1 体ごとの詳細（正規化した生データ + 名称・図鑑説明・種族・危険度・サイズを join）。
 */
export const monsters: Dataset = {
  name: "monsters",
  match: (key) => MONSTER_PREFIXES.some((prefix) => key.startsWith(prefix)),
  transform: (group) => buildFiles(baseTransform(group)),
};

function buildFiles(group: Record<string, unknown>): DatasetFile[] {
  return [
    { id: "monsters/row", data: group },
    { id: "monsters/index", data: buildIndex(group) },
    { id: "monsters/resistances", data: buildResistances(group) },
    ...buildDetails(group),
  ];
}

/** 一覧用インデックス（軽量）。名前・異名・種族・危険度・基準サイズだけを載せる。 */
function buildIndex(data: Record<string, unknown>): unknown[] {
  const names = entryNameMap(data, ["monster_names", "monster_names_mr"], NAME_RE);
  const aliases = entryNameMap(data, ["monster_aliases", "monster_aliases_mr"], ALIAS_RE);
  const families = familyByEm(data);
  const ranks = rankByEm(data);
  const sizes = sizeByEm(data);

  const items = monsterRecords(data).flatMap((record) => {
    const em = emOf(record);
    const enemyType = asNumber(record.enemy_type);
    if (em === undefined || enemyType === undefined) return [];
    const name = names.get(enemyType);
    // 名前を持たないテスト用レコード（em 131 等）は一覧から除外する。
    if (name === undefined) return [];

    return [
      {
        id: em,
        name,
        alias: aliases.get(enemyType) ?? null,
        family: families.get(em) ?? null,
        rank: ranks.get(em) ?? null,
        base_size: sizes.get(em)?.base_size ?? null,
        // 図鑑の並び（enemy_type 昇順）で一覧を整列するためのキー。
        enemy_type: enemyType,
      },
    ];
  });

  items.sort((a, b) => a.enemy_type - b.enemy_type);
  return items;
}

/** モンスター 1 体ごとの詳細を生成する。 */
function buildDetails(data: Record<string, unknown>): DatasetFile[] {
  const names = entryNameMap(data, ["monster_names", "monster_names_mr"], NAME_RE);
  const aliases = entryNameMap(data, ["monster_aliases", "monster_aliases_mr"], ALIAS_RE);
  const explains = explainMap(data);
  const families = familyByEm(data);
  const ranks = rankByEm(data);
  const sizes = sizeByEm(data);
  const lists = listByEm(data);
  const presets = data.condition_preset;

  return monsterRecords(data).flatMap((record) => {
    const em = emOf(record);
    const enemyType = asNumber(record.enemy_type);
    if (em === undefined || enemyType === undefined) return [];
    const name = names.get(enemyType);
    if (name === undefined) return [];

    const normalized = normalizeMonster(record);
    const { id: speciesId, em_type: _em, ...rest } = normalized;
    const detail = {
      ...rest,
      // 状態異常耐性は共有プリセット表で上書きする（§6.6）。
      condition_damage_data: resolveConditionPresets(rest.condition_damage_data, presets),
      // `id` は一意なモンスター id（= Em 値）とし、ルーティングキーに使う。
      id: em,
      // ゲーム内のモンスター id（モンスター種）と枝番。亜種・希少種などは sub_id が異なる。
      species_id: speciesId,
      enemy_type: enemyType,
      name,
      alias: aliases.get(enemyType) ?? null,
      description: explains.get(enemyType) ?? [],
      family: families.get(em) ?? null,
      rank: ranks.get(em) ?? null,
      size: sizes.get(em) ?? null,
      list: lists.get(em) ?? null,
    };

    return [{ id: `monsters/${em}`, data: detail, listed: false }];
  });
}

/**
 * 状態異常耐性の一覧を生成する（`monsters/resistances`）。
 * 状態異常ごとに、プリセット解決後の初期耐性・上昇・最大・効果時間を載せる。
 * `unique` はプリセット表の範囲外（モンスター固有値）かどうか。
 */
function buildResistances(data: Record<string, unknown>): unknown[] {
  const names = entryNameMap(data, ["monster_names", "monster_names_mr"], NAME_RE);
  const presets = data.condition_preset;

  return monsterRecords(data).flatMap((record) => {
    const em = emOf(record);
    const enemyType = asNumber(record.enemy_type);
    if (em === undefined || enemyType === undefined) return [];
    const name = names.get(enemyType);
    if (name === undefined) return [];

    const conditionData = normalizeMonster(record).condition_damage_data;
    if (!isObject(conditionData)) return [];

    const conditions: Record<string, unknown> = {};
    for (const key of RESISTANCE_KEYS) {
      const { value, unique } = resolveCondition(key, conditionData[key], presets);
      if (!isObject(value)) continue;
      const stock = value.default_stock;
      if (!isObject(stock)) continue;
      conditions[key] = {
        initial: asNumber(stock.default_limit) ?? 0,
        add: asNumber(stock.add_limit) ?? 0,
        max: asNumber(stock.max_limit) ?? 0,
        active_time: asNumber(value.active_time) ?? 0,
        unique,
      };
    }

    return [{ id: em, name, conditions }];
  });
}

/**
 * 状態異常 1 種の耐性を解決する。
 *
 * ゲーム側は `preset_type` がプリセット表の範囲内ならそのプリセット値を使い、
 * 範囲外（固有値）のときだけモンスター自身の値を使う（mhrice の
 * `ConditionDamage::or_preset` と同じ）。元の値は `monsters/row` に残る。
 * `unique` は範囲外＝モンスター固有値だったかどうか。
 */
function resolveCondition(
  key: string,
  condition: unknown,
  presets: unknown,
): { value: unknown; unique: boolean } {
  const list = isObject(presets) ? presets[key] : undefined;
  const index = isObject(condition) ? asNumber(condition.preset_type) : undefined;
  const preset = Array.isArray(list) && index !== undefined ? list[index] : undefined;
  return isObject(preset) ? { value: preset, unique: false } : { value: condition, unique: true };
}

/** `condition_damage_data` の各状態異常をプリセットで解決した新しいオブジェクトを返す。 */
function resolveConditionPresets(conditionData: unknown, presets: unknown): unknown {
  if (!isObject(conditionData)) return conditionData;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(conditionData)) {
    out[key] = resolveCondition(key, value, presets).value;
  }
  return out;
}

/** `data.monsters` の各レコードを列挙する。 */
function monsterRecords(data: Record<string, unknown>): Record<string, unknown>[] {
  return asArray(data.monsters).filter(isObject);
}

/** レコードの `em_type.Em`（一意な Em id）を取り出す。正規化済みの数値にも対応する。 */
function emOf(row: Record<string, unknown>): number | undefined {
  const value = row.em_type;
  if (typeof value === "number") return value;
  if (isObject(value)) return asNumber(value.Em);
  return undefined;
}

/** 名称 / 異名マスタから enemy_type → 日本語名を索引化する。 */
function entryNameMap(
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

/** 図鑑説明マスタから enemy_type → ページ順の説明文配列を索引化する。 */
function explainMap(data: Record<string, unknown>): Map<number, string[]> {
  const pages = new Map<number, { page: number; text: string }[]>();
  for (const key of ["monster_explains", "monster_explains_mr"]) {
    const container = data[key];
    if (!isObject(container)) continue;
    for (const entry of asArray(container.entries)) {
      if (!isObject(entry) || typeof entry.name !== "string") continue;
      const match = EXPLAIN_RE.exec(entry.name);
      if (!match) continue;
      const ja = getEntryJa(entry);
      if (ja === undefined) continue;
      const list = pages.get(Number(match[1])) ?? [];
      list.push({ page: Number(match[2]), text: cleanTags(ja) });
      pages.set(Number(match[1]), list);
    }
  }

  const map = new Map<number, string[]>();
  for (const [enemyType, list] of pages) {
    list.sort((a, b) => a.page - b.page);
    map.set(
      enemyType,
      list.map((item) => item.text),
    );
  }
  return map;
}

/** `monster_list` から Em id → 種族表示名を索引化する。 */
function familyByEm(data: Record<string, unknown>): Map<number, string> {
  const map = new Map<number, string>();
  for (const row of monsterListRows(data)) {
    const em = emOf(row);
    const family = row.family_type;
    if (em === undefined || !isObject(family)) continue;
    const species = asNumber(family.Species);
    const mrSpecies = asNumber(family.MrSpecies);
    const key =
      species !== undefined
        ? `Species:${species}`
        : mrSpecies !== undefined
          ? `MrSpecies:${mrSpecies}`
          : undefined;
    const label = key !== undefined ? FAMILY_LABELS[key] : undefined;
    if (label !== undefined) map.set(em, label);
  }
  return map;
}

/** `enemy_rank` から Em id → 危険度を索引化する。 */
function rankByEm(data: Record<string, unknown>): Map<number, number> {
  const map = new Map<number, number>();
  const container = data.enemy_rank;
  if (!isObject(container)) return map;
  for (const row of asArray(container.rank_info_list)) {
    if (!isObject(row)) continue;
    const em = emOf(row);
    const rank = asNumber(row.rank);
    if (em !== undefined && rank !== undefined) map.set(em, rank);
  }
  return map;
}

interface MonsterSize {
  base_size: number;
  small_boarder: number;
  big_boarder: number;
  king_boarder: number;
  no_size_scale: boolean;
}

/** `size_list` から Em id → サイズ情報を索引化する。 */
function sizeByEm(data: Record<string, unknown>): Map<number, MonsterSize> {
  const map = new Map<number, MonsterSize>();
  const container = data.size_list;
  if (!isObject(container)) return map;
  for (const row of asArray(container.size_info_list)) {
    if (!isObject(row)) continue;
    const em = emOf(row);
    if (em === undefined) continue;
    map.set(em, {
      base_size: asNumber(row.base_size) ?? 0,
      small_boarder: asNumber(row.small_boarder) ?? 0,
      big_boarder: asNumber(row.big_boarder) ?? 0,
      king_boarder: asNumber(row.king_boarder) ?? 0,
      no_size_scale: row.no_size_scale === true,
    });
  }
  return map;
}

/** `monster_list` から Em id → 図鑑用メタ（部位テーブル等）を索引化する。 */
function listByEm(data: Record<string, unknown>): Map<number, Record<string, unknown>> {
  const map = new Map<number, Record<string, unknown>>();
  for (const row of monsterListRows(data)) {
    const em = emOf(row);
    if (em === undefined) continue;
    map.set(em, normalizeMonster(row));
  }
  return map;
}

function monsterListRows(data: Record<string, unknown>): Record<string, unknown>[] {
  const container = data.monster_list;
  if (!isObject(container)) return [];
  return asArray(container.data_list).filter(isObject);
}

/**
 * タグ付き union（キーが 1 つだけのオブジェクト）を値へ開く際に認識するキー。
 * 例: `{ Em: 1 }` → 1、`{ Normal: 519 }` → 519。
 */
const TAG_KEYS = new Set<string>(["Em", "Ems", "Normal"]);

/**
 * enum / センチネルを正規化する。
 * - `"None"` → `null`
 * - タグ付き union（`{ Em: 1 }` 等）→ 値
 * - 配列・オブジェクトは再帰的に適用
 */
function normalizeMonster(value: unknown): Record<string, unknown> {
  const normalized = normalize(value);
  return isObject(normalized) ? normalized : {};
}

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
