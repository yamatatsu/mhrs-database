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
