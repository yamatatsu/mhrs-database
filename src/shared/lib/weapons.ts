/** 武器種の表示名とデータセット id の対応。 */
export interface WeaponType {
  /** データセット id・ルートパラメータに使う識別子（例: "great_sword"）。 */
  readonly id: string;
  /** サイドバーやページ見出しに表示する名称（例: "大剣"）。 */
  readonly label: string;
}

/** 武器種の一覧。並び順がそのままサイドバーの表示順になる。 */
export const weaponTypes = [
  { id: "great_sword", label: "大剣" },
  { id: "long_sword", label: "太刀" },
  { id: "short_sword", label: "片手剣" },
  { id: "dual_blades", label: "双剣" },
  { id: "hammer", label: "ハンマー" },
  { id: "horn", label: "狩猟笛" },
  { id: "lance", label: "ランス" },
  { id: "gun_lance", label: "ガンランス" },
  { id: "slash_axe", label: "スラッシュアックス" },
  { id: "charge_axe", label: "チャージアックス" },
  { id: "insect_glaive", label: "操虫棍" },
  { id: "bow", label: "弓" },
  { id: "light_bowgun", label: "ライトボウガン" },
  { id: "heavy_bowgun", label: "ヘビィボウガン" },
] as const satisfies readonly WeaponType[];

/** ルートパラメータ（データセット id）から武器種を引く。 */
export function getWeaponType(id: string): WeaponType | undefined {
  return weaponTypes.find((weaponType) => weaponType.id === id);
}

/** 武器の属性種別。データ上の表記をそのまま使う。 */
export type WeaponElementType =
  | "Fire"
  | "Water"
  | "Thunder"
  | "Ice"
  | "Dragon"
  | "Poison"
  | "Paralyze"
  | "Sleep"
  | "Bomb";

/** 一覧に表示する武器の属性 1 件（種類と威力）。 */
export interface WeaponElement {
  /** 属性の種類。 */
  readonly type: WeaponElementType;
  /** 属性値（威力）。 */
  readonly value: number;
}

/** 属性種別の表示名。 */
const weaponElementLabels = new Map<string, string>([
  ["Fire", "火"],
  ["Water", "水"],
  ["Thunder", "雷"],
  ["Ice", "氷"],
  ["Dragon", "龍"],
  ["Poison", "毒"],
  ["Paralyze", "麻痺"],
  ["Sleep", "睡眠"],
  ["Bomb", "爆破"],
]);

/** 属性種別の表示名を引く。未知の種別はそのまま返す（将来のデータ追加に耐える）。 */
export function getWeaponElementLabel(type: string): string {
  return weaponElementLabels.get(type) ?? type;
}

/** 一覧用インデックス（`weapons/<武器種>/index.json.gz`）の 1 件。 */
export interface WeaponIndexItem {
  /** 武器 id。 */
  readonly id: number;
  /** 武器名（日本語）。 */
  readonly name: string;
  /** レア度。 */
  readonly rarity: number;
  /** 攻撃力。 */
  readonly atk: number;
  /** 会心率（負値あり）。 */
  readonly critical_rate: number;
  /** 属性（種類と威力）。双剣などは複数持つ。無属性なら空配列。 */
  readonly elements: readonly WeaponElement[];
  /** 切れ味（赤 / 橙 / 黄 / 緑 / 青 / 白 / 紫）。弓・ガンナーは空配列。 */
  readonly sharpness_val_list: readonly number[];
  /** 匠による切れ味上昇分（一覧では未使用、データのみ保持）。 */
  readonly takumi_val_list: readonly number[];
  /** 根から自身までの weapon id 配列（派生ツリー上の位置）。 */
  readonly path: readonly number[];
  /** 派生ツリーの前順ソートキー。辞書順で親 → 子孫、兄弟は派生順になる。 */
  readonly sort: string;
}

/**
 * レシピ 1 件（生産 / 強化 / 加工）。素材はアイテム id で保持し、
 * 表示時にアイテム名（`ItemNameTable`）へ解決する。
 */
export interface WeaponRecipe {
  /** レシピ id（武器 id と一致する）。 */
  readonly id: number;
  /** 素材のアイテム id（`null` は空き枠）。 */
  readonly item: readonly (number | null)[];
  /** 素材の必要数（`item` と同じ並び）。 */
  readonly item_num: readonly number[];
  /** 素材カテゴリ id（特定アイテムではなくカテゴリ指定のとき。`null` は指定なし）。 */
  readonly material_category: number | null;
  /** 素材カテゴリの必要数。 */
  readonly material_category_num: number;
}

/** 生産 / 強化 / 加工のレシピ。該当がなければ `null`。 */
export interface WeaponRecipes {
  readonly product: WeaponRecipe | null;
  readonly change: WeaponRecipe | null;
  readonly process: WeaponRecipe | null;
}

/** 派生ツリー上の位置。`prev` / `next` は同じ武器種内の武器 id。 */
export interface WeaponTree {
  /** 系統 id。 */
  readonly type: number;
  /** ツリー内の位置。 */
  readonly index: number;
  /** 親（1 つ前の武器）の id。根は `null`。 */
  readonly prev: number | null;
  /** 子（派生先）の武器 id（派生順）。 */
  readonly next: readonly number[];
}

/**
 * 武器詳細（`weapons/<type>/<id>.json.gz`）の 1 件。
 * 表示に使う主要フィールドのみ型付けする（データには百竜強化・重ね着等も含まれる）。
 */
export interface WeaponDetail {
  readonly id: number;
  readonly name: string | null;
  /** 説明文（改行を含む）。 */
  readonly description: string | null;
  /** レア度。 */
  readonly rare_type: number;
  /** 攻撃力。 */
  readonly atk: number;
  /** 会心率（負値あり）。 */
  readonly critical_rate: number;
  /** 防御力ボーナス。 */
  readonly def_bonus: number;
  /** 主属性の種別（`null` は無属性）。 */
  readonly main_element_type: string | null;
  /** 主属性値。 */
  readonly main_element_val: number;
  /** サブ属性の種別（双剣など）。無い武器種では存在しない。 */
  readonly sub_element_type?: string | null;
  /** サブ属性値。 */
  readonly sub_element_val?: number;
  /** 切れ味（赤 / 橙 / 黄 / 緑 / 青 / 白 / 紫）。弓・ガンナーは空配列。 */
  readonly sharpness_val_list?: readonly number[];
  /** 装飾品スロットの段数（0 は空き）。 */
  readonly slot_num_list: readonly number[];
  /** 百竜スロットの段数（0 は空き）。 */
  readonly hyakuryu_slot_num_list?: readonly number[];
  /** 百竜スキル id（`null` は空き）。 */
  readonly hyakuryu_skill_id_list?: readonly (number | null)[];
  /** ガンナー共通のブレ（`Fluctuation`）。`null` はブレなし。ライト・ヘビィのみ。 */
  readonly fluctuation?: string | null;
  /** ガンナー共通のリロード速度（数値。大きいほど速い）。ライト・ヘビィのみ。 */
  readonly reload?: number;
  /** ガンナー共通の反動（数値。大きいほど大きい）。ライト・ヘビィのみ。 */
  readonly recoil?: number;
  /** 速射する弾（BulletType 名）。ライトボウガンのみ。`null` は空き枠。 */
  readonly rapid_shot_list?: readonly (string | null)[];
  /** 特殊弾（BulletType 名）。ライトボウガンは `Setti`（起爆竜弾）。 */
  readonly unique_bullet?: string;
  /** 弾種ごとの装填可否。添字は `BulletType`（§5.4.4）。 */
  readonly bullet_equip_flag_list?: readonly boolean[];
  /** 弾種ごとの装填数（`bullet_equip_flag_list` と同じ並び）。 */
  readonly bullet_num_list?: readonly number[];
  /** 弾種ごとの射撃タイプ（`ShootType` 名）。`null` は射撃タイプなし。 */
  readonly bullet_type_list?: readonly (string | null)[];
  readonly recipes: WeaponRecipes;
  readonly tree: WeaponTree | null;
}

/**
 * 武器詳細の属性を配列へまとめる（一覧の `WeaponIndexItem.elements` と同じ形）。
 * 属性値が 0 のものは無属性として除外する。
 */
export function getWeaponDetailElements(detail: WeaponDetail): readonly WeaponElement[] {
  const elements: WeaponElement[] = [];
  if (detail.main_element_type !== null && detail.main_element_val > 0) {
    elements.push({
      type: detail.main_element_type as WeaponElementType,
      value: detail.main_element_val,
    });
  }
  const subValue = detail.sub_element_val ?? 0;
  if (detail.sub_element_type != null && subValue > 0) {
    elements.push({ type: detail.sub_element_type as WeaponElementType, value: subValue });
  }
  return elements;
}

/**
 * 弾種（`BulletType`）の並び。添字が `bullet_equip_flag_list` / `bullet_num_list` /
 * `bullet_type_list` の添字に対応する。出典: mhrice の `BulletType`（§5.4.4）。
 */
const weaponBulletTypes = [
  "None",
  "Normal1",
  "Normal2",
  "Normal3",
  "Kantsu1",
  "Kantsu2",
  "Kantsu3",
  "SanW1",
  "SanW2",
  "SanW3",
  "SanO1",
  "SanO2",
  "SanO3",
  "Tekko1",
  "Tekko2",
  "Tekko3",
  "Kakusan1",
  "Kakusan2",
  "Kakusan3",
  "Poison1",
  "Poison2",
  "Paralyze1",
  "Paralyze2",
  "Sleep1",
  "Sleep2",
  "Genki1",
  "Genki2",
  "Heal1",
  "Heal2",
  "Kijin",
  "Kouka",
  "Fire",
  "FireKantsu",
  "Water",
  "WaterKantsu",
  "Ice",
  "IceKantsu",
  "Thunder",
  "ThunderKantsu",
  "Dragon",
  "DragonKantsu",
  "Zanretsu",
  "Ryugeki",
  "Capture",
  "Setti",
  "Gatling",
  "Snipe",
  "GatlingHeal",
  "SnipeHeal",
  "WireBullet",
  "FullAuto",
  "Max",
] as const;

/** 弾種（`BulletType`）の表示名。実在する弾種のみ日本語名を持ち、他は生の表記にフォールバックする。 */
const weaponBulletLabels = new Map<string, string>([
  ["Normal1", "通常弾1"],
  ["Normal2", "通常弾2"],
  ["Normal3", "通常弾3"],
  ["Kantsu1", "貫通弾1"],
  ["Kantsu2", "貫通弾2"],
  ["Kantsu3", "貫通弾3"],
  ["SanW1", "散弾1"],
  ["SanW2", "散弾2"],
  ["SanW3", "散弾3"],
  ["SanO1", "放散弾1"],
  ["SanO2", "放散弾2"],
  ["SanO3", "放散弾3"],
  ["Tekko1", "徹甲榴弾1"],
  ["Tekko2", "徹甲榴弾2"],
  ["Tekko3", "徹甲榴弾3"],
  ["Kakusan1", "拡散弾1"],
  ["Kakusan2", "拡散弾2"],
  ["Kakusan3", "拡散弾3"],
  ["Poison1", "毒弾1"],
  ["Poison2", "毒弾2"],
  ["Paralyze1", "麻痺弾1"],
  ["Paralyze2", "麻痺弾2"],
  ["Sleep1", "睡眠弾1"],
  ["Sleep2", "睡眠弾2"],
  ["Genki1", "減気弾1"],
  ["Genki2", "減気弾2"],
  ["Heal1", "回復弾1"],
  ["Heal2", "回復弾2"],
  ["Kijin", "鬼人弾"],
  ["Kouka", "硬化弾"],
  ["Fire", "火炎弾"],
  ["FireKantsu", "貫通火炎弾"],
  ["Water", "水冷弾"],
  ["WaterKantsu", "貫通水冷弾"],
  ["Ice", "氷結弾"],
  ["IceKantsu", "貫通氷結弾"],
  ["Thunder", "電撃弾"],
  ["ThunderKantsu", "貫通電撃弾"],
  ["Dragon", "滅龍弾"],
  ["DragonKantsu", "貫通滅龍弾"],
  ["Zanretsu", "斬裂弾"],
  ["Ryugeki", "竜撃弾"],
  ["Capture", "捕獲用麻酔弾"],
  ["Setti", "起爆竜弾"],
]);

/** 弾種（`BulletType`）の表示名を引く。未知の種別はそのまま返す。 */
export function getWeaponBulletLabel(type: string): string {
  return weaponBulletLabels.get(type) ?? type;
}

/** ブレ（`Fluctuation`）の表示名。`null` はブレなし。 */
const weaponFluctuationLabels = new Map<string, string>([
  ["LeftLittle", "左小"],
  ["LeftMuch", "左大"],
  ["RightLittle", "右小"],
  ["RightMuch", "右大"],
  ["RightAndLeftLittle", "左右小"],
  ["RightAndLeftMuch", "左右大"],
]);

/** ブレ（`Fluctuation`）の表示名を引く。`null` は「なし」。 */
export function getWeaponFluctuationLabel(type: string | null | undefined): string {
  if (type === null || type === undefined) return "なし";
  return weaponFluctuationLabels.get(type) ?? type;
}

/** 弾の射撃タイプ（`ShootType`）。移動射撃・移動装填・自動装填の可否。 */
export interface WeaponShotType {
  readonly movingShot: boolean;
  readonly movingReload: boolean;
  readonly singleAuto: boolean;
}

/** `ShootType` 名 → 射撃タイプの可否。 */
const weaponShotTypes: Record<string, WeaponShotType> = {
  None: { movingShot: false, movingReload: false, singleAuto: false },
  MovingShot: { movingShot: true, movingReload: false, singleAuto: false },
  MovingShotReload: { movingShot: true, movingReload: true, singleAuto: false },
  MovingShotSingleAuto: { movingShot: true, movingReload: false, singleAuto: true },
  MovingReload: { movingShot: false, movingReload: true, singleAuto: false },
  MovingReloadSingleAuto: { movingShot: false, movingReload: true, singleAuto: true },
  SingleAuto: { movingShot: false, movingReload: false, singleAuto: true },
  MovingShotReloadSingleAuto: { movingShot: true, movingReload: true, singleAuto: true },
};

/** 弾の射撃タイプを引く。未知・未指定は全て false。 */
export function getWeaponShotType(type: string | null | undefined): WeaponShotType {
  if (type === null || type === undefined) {
    return { movingShot: false, movingReload: false, singleAuto: false };
  }
  return weaponShotTypes[type] ?? { movingShot: false, movingReload: false, singleAuto: false };
}

/** 弾テーブル 1 行（装填可能な弾 1 種）。 */
export interface WeaponBullet {
  /** BulletType 名。 */
  readonly type: string;
  /** 弾種の表示名。 */
  readonly name: string;
  /** 装填数。 */
  readonly capacity: number;
  /** 射撃タイプ。 */
  readonly shotType: WeaponShotType;
  /** 速射する弾か。 */
  readonly rapid: boolean;
}

/**
 * 武器詳細から装填可能な弾（`bullet_equip_flag_list` が `true` の弾）を
 * `BulletType` の並び順でまとめる。ガンナー以外は空配列。
 */
export function getWeaponBullets(detail: WeaponDetail): readonly WeaponBullet[] {
  const flags = detail.bullet_equip_flag_list;
  if (!flags) return [];
  const nums = detail.bullet_num_list ?? [];
  const types = detail.bullet_type_list ?? [];
  const rapid = new Set(
    (detail.rapid_shot_list ?? []).filter((value): value is string => typeof value === "string"),
  );
  const bullets: WeaponBullet[] = [];
  flags.forEach((equipped, index) => {
    if (!equipped) return;
    const type = weaponBulletTypes[index];
    if (type === undefined) return;
    bullets.push({
      type,
      name: getWeaponBulletLabel(type),
      capacity: nums[index] ?? 0,
      shotType: getWeaponShotType(types[index] ?? null),
      rapid: rapid.has(type),
    });
  });
  return bullets;
}
