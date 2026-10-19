import {
  getMonsterPartLabel,
  monsterHitzoneColumns,
  type MonsterDetail,
  type MonsterMeatGroup,
} from "@/shared/lib";

/**
 * 肉質 1 セルの値。
 * - `single`: すべての相で同値（`value` を 1 つ表示）。
 * - `multiple`: 相によって異なる（`values` を相の順に並べて表示）。
 */
export type MonsterHitzoneValue =
  | { readonly kind: "single"; readonly value: number }
  | { readonly kind: "multiple"; readonly values: readonly number[] };

/** 肉質テーブルの 1 行（部位）。 */
export interface MonsterHitzoneRow {
  /** 部位インデックス（`meat_map` のキー）。 */
  readonly index: number;
  /** 表示用の部位名。 */
  readonly part: string;
  /** 各列の値。並びは `monsterHitzoneColumns` と同じ。 */
  readonly values: readonly MonsterHitzoneValue[];
}

/**
 * 肉質を部位ごとにまとめ、相ごとの値を畳んだ行を作る。
 * 相の順序は `meat_group_info` の並び（先頭が最初の相）。
 * 部位を持たない（`meat_group_info` が空の）エントリは行にしない。
 */
export function buildMonsterHitzoneRows(detail: MonsterDetail): MonsterHitzoneRow[] {
  const meatMap = detail.collider_mapping?.meat_map;
  const containers = detail.meat_data?.meat_container;
  if (!meatMap || !containers) return [];

  return Object.entries(meatMap)
    .map(([index, names]) => ({ index: Number(index), names }))
    .sort((a, b) => a.index - b.index)
    .flatMap((entry) => {
      const groups = containers[entry.index]?.meat_group_info ?? [];
      if (groups.length === 0) return [];
      return [
        {
          index: entry.index,
          part: getMonsterPartLabel(entry.names),
          values: monsterHitzoneColumns.map((column) => collapseGroups(groups, column.key)),
        },
      ];
    });
}

/** 相ごとの値を 1 セルへ畳む。全相が同値なら単一値、1 つでも異なれば相の順の配列。 */
function collapseGroups(
  groups: readonly MonsterMeatGroup[],
  key: keyof MonsterMeatGroup,
): MonsterHitzoneValue {
  const values = groups.map((group) => group[key]);
  const [first] = values;
  if (values.every((value) => value === first)) {
    return { kind: "single", value: first };
  }
  return { kind: "multiple", values };
}

/** セルの値を表示用の文字列にする（配列は相の順に `/` 区切り）。 */
export function formatMonsterHitzoneValue(value: MonsterHitzoneValue): string {
  return value.kind === "single" ? String(value.value) : value.values.join("/");
}

/** 肉質値のヒートマップ段階。 */
export type MonsterHitzoneHeatLevel = "none" | "low" | "medium" | "high" | "severe";

/**
 * ヒートマップのしきい値（`medium` / `high` / `severe` の下限）。
 * 物理は 45 以上、属性は 20 以上が弱点の目安なので、別々のルールで色分けする。
 */
const heatThresholds = {
  physical: { medium: 25, high: 45, severe: 65 },
  elemental: { medium: 10, high: 20, severe: 30 },
} as const;

/**
 * 相によって値が変わるセルは、最も高い値（その部位を狙う価値があるか）で段階を決める。
 * 物理（斬撃・打撃・砲撃）と属性（火・水・氷・雷・龍）でしきい値が異なる。
 */
export function getMonsterHitzoneHeatLevel(
  value: MonsterHitzoneValue,
  group: keyof typeof heatThresholds,
): MonsterHitzoneHeatLevel {
  const peak = value.kind === "single" ? value.value : Math.max(...value.values);
  if (peak <= 0) return "none";
  const { medium, high, severe } = heatThresholds[group];
  if (peak < medium) return "low";
  if (peak < high) return "medium";
  if (peak < severe) return "high";
  return "severe";
}

/** いずれかの部位で相により値が変わるか（注記の表示判定に使う）。 */
export function hasMonsterHitzoneVariation(rows: readonly MonsterHitzoneRow[]): boolean {
  return rows.some((row) => row.values.some((value) => value.kind === "multiple"));
}
