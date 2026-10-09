import { loadDataset } from "@/shared/api";
import type { WeaponIndexItem, WeaponType } from "@/shared/lib";
import type { HornIndexItem } from "../model/horn";

/**
 * 一覧ページが必要とする武器データ。武器種固有の拡張を持つものだけ `kind` で判別する。
 * 武器種を追加するときは、ここに `kind` を 1 つ足し、`loadWeaponList` で解決する。
 */
export type WeaponListData =
  | { readonly kind: "standard"; readonly items: readonly WeaponIndexItem[] }
  | { readonly kind: "horn"; readonly items: readonly HornIndexItem[] };

/**
 * 武器種の一覧インデックス（`weapons/<武器種>/index`）を読み込む。
 * 武器種固有フィールド（例: 狩猟笛の `melodies`）の解決はこの関数に集約する。
 */
export async function loadWeaponList(weaponType: WeaponType): Promise<WeaponListData> {
  const items = await loadDataset<readonly WeaponIndexItem[]>(`weapons/${weaponType.id}/index`);
  // 狩猟笛の index は ETL が旋律マスタを join 済み（docs/specs/data.md §5.4.3）。
  return weaponType.id === "horn"
    ? { kind: "horn", items: items as readonly HornIndexItem[] }
    : { kind: "standard", items };
}
