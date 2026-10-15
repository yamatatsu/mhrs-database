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

/** いずれかの部位で相により値が変わるか（注記の表示判定に使う）。 */
export function hasMonsterHitzoneVariation(rows: readonly MonsterHitzoneRow[]): boolean {
  return rows.some((row) => row.values.some((value) => value.kind === "multiple"));
}
