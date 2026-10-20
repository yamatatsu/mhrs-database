import { getWeaponBulletLabel, getWeaponElementLabel, type WeaponIndexItem } from "@/shared/lib";
import type { HornIndexItem } from "./horn";
import type { LightBowgunIndexItem } from "./light-bowgun";

/** セレクトボックスの 1 項目。 */
export interface FilterOption {
  readonly value: string;
  readonly label: string;
}

/** 属性フィルターで「無属性」を表す値。 */
const NO_ELEMENT = "none";

/** 属性の表示順。ゲーム内の並びに合わせる。 */
const elementOrder = [
  "Fire",
  "Water",
  "Thunder",
  "Ice",
  "Dragon",
  "Poison",
  "Paralyze",
  "Sleep",
  "Bomb",
] as const;

const elementOrderIndex = new Map<string, number>(elementOrder.map((type, index) => [type, index]));

/**
 * 一覧に存在する属性の選択肢。属性持ちの武器が 1 つもなければ空配列。
 * 無属性の武器が混ざっている場合だけ「無属性」を末尾に足す。
 */
export function getElementFilterOptions(items: readonly WeaponIndexItem[]): FilterOption[] {
  const types = new Set<string>();
  let hasNonElemental = false;

  for (const item of items) {
    if (item.elements.length === 0) {
      hasNonElemental = true;
      continue;
    }
    for (const element of item.elements) types.add(element.type);
  }

  if (types.size === 0) return [];

  const options = [...types]
    .map((type) => ({ value: type, label: getWeaponElementLabel(type) }))
    .sort(
      (a, b) =>
        (elementOrderIndex.get(a.value) ?? elementOrder.length) -
        (elementOrderIndex.get(b.value) ?? elementOrder.length),
    );

  if (hasNonElemental) options.push({ value: NO_ELEMENT, label: "無属性" });
  return options;
}

/** 狩猟笛の旋律の選択肢。旋律 id を値に持つ。 */
export function getMelodyFilterOptions(items: readonly HornIndexItem[]): FilterOption[] {
  const names = new Map<number, string>();
  for (const item of items) {
    for (const melody of item.melodies) names.set(melody.id, melody.name);
  }

  return [...names]
    .map(([id, label]) => ({ value: String(id), label }))
    .sort((a, b) => a.label.localeCompare(b.label, "ja"));
}

/** ライトボウガンの速射弾の選択肢。BulletType 名を値に持つ。 */
export function getRapidFireFilterOptions(items: readonly LightBowgunIndexItem[]): FilterOption[] {
  const types = new Set<string>();
  for (const item of items) {
    for (const bullet of item.rapid_fire) types.add(bullet);
  }

  return [...types]
    .map((type) => ({ value: type, label: getWeaponBulletLabel(type) }))
    .sort((a, b) => a.label.localeCompare(b.label, "ja"));
}

/** 属性フィルターに一致するか。`null` はすべて、`NO_ELEMENT` は無属性。 */
export function matchesElement(weapon: WeaponIndexItem, element: string | null): boolean {
  if (element === null) return true;
  if (element === NO_ELEMENT) return weapon.elements.length === 0;
  return weapon.elements.some((candidate) => candidate.type === element);
}
