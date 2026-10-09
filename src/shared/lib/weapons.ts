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
  /** 系統名（解決できた場合のみ）。 */
  readonly series?: string;
  /** 根から自身までの weapon id 配列（派生ツリー上の位置）。 */
  readonly path: readonly number[];
  /** 派生ツリーの前順ソートキー。辞書順で親 → 子孫、兄弟は派生順になる。 */
  readonly sort: string;
}
