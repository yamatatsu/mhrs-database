import { loadDataset } from "@/shared/api";
import type { MonsterResistanceItem } from "@/shared/lib";

/** 状態異常耐性の一覧（`monsters/resistances`）を読み込む。 */
export function loadResistances(): Promise<readonly MonsterResistanceItem[]> {
  return loadDataset<readonly MonsterResistanceItem[]>("monsters/resistances");
}
