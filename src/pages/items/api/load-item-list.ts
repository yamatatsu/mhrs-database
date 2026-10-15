import { loadDataset } from "@/shared/api";
import type { ItemIndexItem } from "../model/items";

/** アイテム一覧インデックス（`items/index`）を読み込む。 */
export function loadItemList(): Promise<readonly ItemIndexItem[]> {
  return loadDataset<readonly ItemIndexItem[]>("items/index");
}
