import { loadDataset } from "@/shared/api";
import type { WeaponIndexItem, WeaponType } from "@/shared/lib";
import type { HornIndexItem } from "../model/horn";
import type { LightBowgunIndexItem } from "../model/light-bowgun";

/**
 * 一覧ページが必要とする武器データ。武器種固有の拡張を持つものだけ `kind` で判別する。
 * 武器種を追加するときは、ここに `kind` を 1 つ足し、`loadWeaponList` で解決する。
 */
export type WeaponListData =
  | { readonly kind: "standard"; readonly items: readonly WeaponIndexItem[] }
  | { readonly kind: "horn"; readonly items: readonly HornIndexItem[] }
  | { readonly kind: "light_bowgun"; readonly items: readonly LightBowgunIndexItem[] };

/**
 * 武器種の一覧インデックス（`weapons/<武器種>/index`）を読み込む。
 * 武器種固有フィールド（例: 狩猟笛の `melodies`、ライトボウガンの速射）の解決はこの関数に集約する。
 */
export async function loadWeaponList(weaponType: WeaponType): Promise<WeaponListData> {
  const items = await loadDataset<readonly WeaponIndexItem[]>(`weapons/${weaponType.id}/index`);
  // 狩猟笛の index は ETL が旋律マスタを join 済み（docs/specs/data.md §5.4.3）。
  if (weaponType.id === "horn") {
    return { kind: "horn", items: items as readonly HornIndexItem[] };
  }
  // ライトボウガンの index は ETL が速射・ブレ・リロード・反動を載せている（同 §5.4.4）。
  if (weaponType.id === "light_bowgun") {
    return { kind: "light_bowgun", items: items as readonly LightBowgunIndexItem[] };
  }
  return { kind: "standard", items };
}
