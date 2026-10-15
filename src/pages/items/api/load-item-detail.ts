import { loadDataset } from "@/shared/api";
import type { ItemDetail } from "../model/items";

/** アイテム 1 件の詳細（`items/<id>`）を読み込む。 */
export function loadItemDetail(id: number): Promise<ItemDetail> {
  return loadDataset<ItemDetail>(`items/${id}`);
}
