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
