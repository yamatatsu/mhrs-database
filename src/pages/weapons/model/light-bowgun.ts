import type { WeaponIndexItem } from "@/shared/lib";

/**
 * ライトボウガンの一覧インデックス。他武器種の index にはガンナー固有フィールドが
 * 存在しないため、ライトボウガンのときだけこの型として扱う（`load-weapon-list.ts`）。
 * 出典: `scripts/etl/datasets/weapons.ts` の `gunnerIndexFields`（data.md §5.4.4）。
 */
export interface LightBowgunIndexItem extends WeaponIndexItem {
  /** 速射する弾（BulletType 名）。速射なしは空配列。 */
  readonly rapid_fire: readonly string[];
  /** ブレ（`Fluctuation`）。`null` はブレなし。 */
  readonly deviation: string | null;
  /** リロード速度（数値。大きいほど速い）。 */
  readonly reload: number;
  /** 反動（数値。大きいほど大きい）。 */
  readonly recoil: number;
}
