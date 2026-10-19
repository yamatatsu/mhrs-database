/** 一覧用インデックス（`monsters/index.json.gz`）の 1 件。 */
export interface MonsterIndexItem {
  /** モンスター id（内部一意 id、詳細ページのルーティングキー）。 */
  readonly id: number;
  /** モンスター名（日本語）。 */
  readonly name: string;
  /** 異名（日本語）。無い場合は `null`。 */
  readonly alias: string | null;
  /** 種族（例: "飛竜種"）。不明な場合は `null`。 */
  readonly family: string | null;
  /** 危険度（1〜10）。不明な場合は `null`。 */
  readonly rank: number | null;
  /** サイズの基準値。不明な場合は `null`。 */
  readonly base_size: number | null;
  /** 図鑑の並びインデックス（一覧はこの昇順）。 */
  readonly enemy_type: number;
}

/** モンスターのサイズ情報（`size_list` の 1 件）。 */
export interface MonsterSize {
  readonly base_size: number;
  readonly small_boarder: number;
  readonly big_boarder: number;
  readonly king_boarder: number;
  readonly no_size_scale: boolean;
}

/** 肉質の 1 グループ（状態ごとの部位肉質）。 */
export interface MonsterMeatGroup {
  /** 斬撃。 */
  readonly slash: number;
  /** 打撃。 */
  readonly strike: number;
  /** 砲撃（ガンランス）。 */
  readonly shell: number;
  readonly fire: number;
  readonly water: number;
  readonly ice: number;
  /** 雷。 */
  readonly elect: number;
  readonly dragon: number;
  /** 気絶。 */
  readonly piyo: number;
}

/** 部位ごとの肉質。`meat_group_info` は状態（通常・怒り等）ごとの値を持つ。 */
export interface MonsterMeatContainer {
  readonly meat_group_info: readonly MonsterMeatGroup[];
}

/** 状態異常の耐性値（`default_stock` / `ride_stock`）。 */
export interface MonsterConditionStock {
  /** 初期耐性値。 */
  readonly default_limit: number;
  /** 耐性値の上昇量。 */
  readonly add_limit: number;
  /** 最大耐性値。 */
  readonly max_limit: number;
  /** 耐性値の自然減少（値 / 間隔秒）。 */
  readonly sub_value: number;
  readonly sub_interval: number;
}

/** 状態異常 1 種のデータ。 */
export interface MonsterCondition {
  readonly default_stock: MonsterConditionStock;
  readonly ride_stock?: MonsterConditionStock;
  /** 効果時間（秒）。 */
  readonly active_time: number;
}

/** 状態異常耐性一覧（`monsters/resistances.json.gz`）の 1 件。 */
export interface MonsterResistanceItem {
  /** モンスター id（内部一意 id）。 */
  readonly id: number;
  /** モンスター名（日本語）。 */
  readonly name: string;
  /** 状態異常キー → 耐性値。プリセット解決済み（§6.6）。 */
  readonly conditions: Readonly<Record<string, MonsterResistanceValue | undefined>>;
}

/** 状態異常 1 種の耐性値（プリセット解決済み）。 */
export interface MonsterResistanceValue {
  /** 初期耐性値。 */
  readonly initial: number;
  /** 耐性値の上昇量。 */
  readonly add: number;
  /** 最大耐性値。 */
  readonly max: number;
  /** 効果時間（秒）。0 は効果時間なし。 */
  readonly active_time: number;
  /** プリセット表の範囲外（モンスター固有値）かどうか。 */
  readonly unique: boolean;
}

/** 部位破壊の 1 部位。 */
export interface MonsterPartBreak {
  /** 部位名（例: `"頭部"` / `"尻尾"`）。 */
  readonly part: string;
  /** 部位破壊の段階（1 または 2）。切断のみの部位は `null`。 */
  readonly level: number | null;
  /** 切断できる部位かどうか。 */
  readonly severable: boolean;
}

/** 部位と肉質グループの対応（`collider_mapping`）。 */
export interface MonsterColliderMapping {
  /** 肉質インデックス → 部位名（例: `"0": ["A：頭部", ...]`）。 */
  readonly meat_map: Readonly<Record<string, readonly string[]>>;
  /** 部位インデックス → 部位名（例: `"0": ["頭部"]`）。 */
  readonly part_map: Readonly<Record<string, readonly string[]>>;
}

/** モンスター詳細（`monsters/<id>.json.gz`）の 1 件。表示に使う主要フィールドのみ型付けする。 */
export interface MonsterDetail {
  /** モンスター id（内部一意 id）。 */
  readonly id: number;
  /** ゲーム内モンスター id（モンスター種）。 */
  readonly species_id: number;
  /** 枝番（亜種・希少種など）。 */
  readonly sub_id: number;
  /** 図鑑の並びインデックス。 */
  readonly enemy_type: number;
  readonly name: string | null;
  readonly alias: string | null;
  /** 図鑑説明（ページ順）。 */
  readonly description: readonly string[];
  readonly family: string | null;
  readonly rank: number | null;
  readonly size: MonsterSize | null;
  readonly data_tune?: {
    readonly base_hp_vital: number;
    readonly master_hp_vital: number;
  };
  readonly meat_data?: { readonly meat_container: readonly MonsterMeatContainer[] };
  /** 部位破壊の一覧（`parts_break_reward` × `parts_type` を解決済み）。 */
  readonly parts_break?: readonly MonsterPartBreak[];
  readonly collider_mapping?: MonsterColliderMapping;
  readonly condition_damage_data?: Readonly<Record<string, MonsterCondition | undefined>>;
}

/** 肉質テーブルの列（キーは `MonsterMeatGroup` のフィールド名）。 */
export const monsterHitzoneColumns = [
  { key: "slash", label: "斬撃" },
  { key: "strike", label: "打撃" },
  { key: "shell", label: "砲撃" },
  { key: "fire", label: "火" },
  { key: "water", label: "水" },
  { key: "ice", label: "氷" },
  { key: "elect", label: "雷" },
  { key: "dragon", label: "龍" },
  { key: "piyo", label: "気絶" },
] as const satisfies readonly { key: keyof MonsterMeatGroup; label: string }[];

/** 状態異常テーブルに表示する状態異常の一覧。 */
export const monsterStatusTypes = [
  { key: "paralyze_data", label: "麻痺" },
  { key: "sleep_data", label: "睡眠" },
  { key: "stun_data", label: "気絶" },
  { key: "stamina_data", label: "スタミナ" },
  { key: "poison_data", label: "毒" },
  { key: "blast_data", label: "爆破" },
  { key: "flash_data", label: "閃光" },
  { key: "marionette_data", label: "乗り" },
] as const;

/**
 * 状態異常耐性一覧（`monsters/resistances`）で扱う状態異常。
 * 耐性値（初期 / 上昇 / 最大）でパターン化できるものだけを載せる（閃光・乗りは除外）。
 */
export const monsterResistanceTypes = [
  { key: "paralyze_data", label: "麻痺" },
  { key: "sleep_data", label: "睡眠" },
  { key: "stun_data", label: "気絶" },
  { key: "stamina_data", label: "スタミナ" },
  { key: "poison_data", label: "毒" },
  { key: "blast_data", label: "爆破" },
] as const;

/**
 * 肉質の部位名（`meat_map` の値）から表示用の部位名を作る。
 * 例: `["A：頭部", "A：頭部_顎用（クグツ）"]` → `"頭部"`。
 * 先頭の「A：」などのグループ記号を除き、最初の名称を使う。
 */
export function getMonsterPartLabel(names: readonly string[]): string {
  const first = names[0];
  if (first === undefined) return "";
  return first.replace(/^[A-Z][:：]/, "");
}
