import type { MonsterCondition } from "@/shared/lib";

/**
 * 状態異常の効きやすさ。
 * - `weak`: 特に効く（弱点）。
 * - `resist`: 効きにくい部類。
 * - `none`: 効果なし（耐性値が 0）。
 */
export type MonsterStatusWeakness = "weak" | "resist" | "none";

/**
 * 状態異常ごとの初期耐性の境界。
 * `weakMax` 以下なら弱点（○）、`resistMin` 以上なら効きにくい（△）、
 * その間は標準として表示しない。値は状態異常ごとの耐性パターン分布から決めた。
 */
const WEAKNESS_BOUNDS: Readonly<Record<string, { weakMax: number; resistMin: number }>> = {
  paralyze_data: { weakMax: 130, resistMin: 300 },
  sleep_data: { weakMax: 100, resistMin: 250 },
  stun_data: { weakMax: 100, resistMin: 200 },
  stamina_data: { weakMax: 150, resistMin: 375 },
  poison_data: { weakMax: 100, resistMin: 250 },
  blast_data: { weakMax: 40, resistMin: 120 },
};

/**
 * 状態異常の効きやすさを判定する。
 * 初期耐性がその状態異常の標準より低ければ弱点、高ければ効きにくい部類。
 * 耐性値がすべて 0 の状態異常（減気など）は効果なしとする。
 * 判定対象外の状態異常（閃光・乗り）は `undefined`。
 */
export function getMonsterStatusWeakness(
  key: string,
  condition: MonsterCondition,
): MonsterStatusWeakness | undefined {
  const bounds = WEAKNESS_BOUNDS[key];
  if (!bounds) return undefined;

  const stock = condition.default_stock;
  if (stock.default_limit === 0 && stock.add_limit === 0 && stock.max_limit === 0) {
    return "none";
  }
  if (stock.default_limit <= bounds.weakMax) return "weak";
  if (stock.default_limit >= bounds.resistMin) return "resist";
  return undefined;
}

/** 効きやすさを表示用の記号にする。 */
export function formatMonsterStatusWeakness(weakness: MonsterStatusWeakness | undefined): string {
  switch (weakness) {
    case "weak":
      return "○";
    case "resist":
      return "△";
    case "none":
      return "無効";
    default:
      return "";
  }
}
