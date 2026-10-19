import type { MonsterResistanceItem, MonsterResistanceValue } from "@/shared/lib";

/** グループ内のモンスター参照。 */
export interface ResistanceMonster {
  readonly id: number;
  readonly name: string;
}

/** 同じ耐性値（初期・上昇・最大）を持つモンスターのまとまり。 */
export interface ResistanceGroup {
  readonly initial: number;
  readonly add: number;
  readonly max: number;
  /** 効果時間（秒）。0 は効果時間なし。 */
  readonly active_time: number;
  readonly monsters: readonly ResistanceMonster[];
}

/**
 * 状態異常 1 種について、同じ耐性値（初期 / 上昇 / 最大）のモンスターをまとめる。
 * 並びは初期耐性 → 上昇 → 最大の昇順（効きやすい順）。モンスターは id 昇順。
 */
export function buildResistanceGroups(
  items: readonly MonsterResistanceItem[],
  key: string,
): ResistanceGroup[] {
  const groups = new Map<
    string,
    { value: MonsterResistanceValue; monsters: ResistanceMonster[] }
  >();

  for (const item of items) {
    const value = item.conditions[key];
    if (!value) continue;
    const id = `${value.initial}/${value.add}/${value.max}`;
    const entry = groups.get(id);
    if (entry) {
      entry.monsters.push({ id: item.id, name: item.name });
    } else {
      groups.set(id, { value, monsters: [{ id: item.id, name: item.name }] });
    }
  }

  return [...groups.values()]
    .map(({ value, monsters }) => ({
      initial: value.initial,
      add: value.add,
      max: value.max,
      active_time: value.active_time,
      monsters: [...monsters].sort((a, b) => a.id - b.id),
    }))
    .sort((a, b) => a.initial - b.initial || a.add - b.add || a.max - b.max);
}
