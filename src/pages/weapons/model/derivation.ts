import type { WeaponIndexItem } from "@/shared/lib";

/** 派生ツリーのノード。 */
export interface WeaponTreeNode {
  /** このノードの武器。 */
  readonly weapon: WeaponIndexItem;
  /** 派生先。一覧の前順（派生順）を保つ。 */
  readonly children: readonly WeaponTreeNode[];
}

/**
 * 同じ武器種の一覧から、指定した武器が属する派生ツリーを組み立てる。
 *
 * `path` は根から自身までの weapon id 配列なので、末尾の 1 つ前が親になる。
 * 一覧は派生ツリーの前順で並んでいるため、子の順序はそのまま派生順になる。
 */
export function buildWeaponTree(
  items: readonly WeaponIndexItem[],
  weaponId: number,
): WeaponTreeNode | undefined {
  const target = items.find((item) => item.id === weaponId);
  if (!target) return undefined;

  const rootId = target.path[0] ?? target.id;
  const childrenByParent = new Map<number, WeaponIndexItem[]>();

  for (const item of items) {
    if (item.path.length < 2) continue;
    const parentId = item.path[item.path.length - 2];
    const siblings = childrenByParent.get(parentId);
    if (siblings) {
      siblings.push(item);
    } else {
      childrenByParent.set(parentId, [item]);
    }
  }

  const build = (weapon: WeaponIndexItem): WeaponTreeNode => ({
    weapon,
    children: (childrenByParent.get(weapon.id) ?? []).map(build),
  });

  const root = items.find((item) => item.id === rootId);
  return root ? build(root) : undefined;
}
