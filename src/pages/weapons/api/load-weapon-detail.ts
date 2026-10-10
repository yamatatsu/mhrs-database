import { loadDataset } from "@/shared/api";
import type { WeaponDetail, WeaponType } from "@/shared/lib";

/** 武器 1 件の詳細（`weapons/<武器種>/<id>`）を読み込む。 */
export function loadWeaponDetail(weaponType: WeaponType, id: number): Promise<WeaponDetail> {
  return loadDataset<WeaponDetail>(`weapons/${weaponType.id}/${id}`);
}
