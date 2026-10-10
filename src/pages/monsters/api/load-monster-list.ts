import { loadDataset } from "@/shared/api";
import type { MonsterIndexItem } from "@/shared/lib";

/** モンスター一覧インデックス（`monsters/index`）を読み込む。 */
export function loadMonsterList(): Promise<readonly MonsterIndexItem[]> {
  return loadDataset<readonly MonsterIndexItem[]>("monsters/index");
}
