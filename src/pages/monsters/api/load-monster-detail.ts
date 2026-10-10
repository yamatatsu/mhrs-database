import { loadDataset } from "@/shared/api";
import type { MonsterDetail } from "@/shared/lib";

/** モンスター 1 体の詳細（`monsters/<id>`）を読み込む。 */
export function loadMonsterDetail(id: number): Promise<MonsterDetail> {
  return loadDataset<MonsterDetail>(`monsters/${id}`);
}
