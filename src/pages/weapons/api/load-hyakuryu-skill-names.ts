import { loadDataset } from "@/shared/api";
import type { HyakuryuSkillNameTable } from "@/shared/lib";

/**
 * 百竜スキル id → 名称テーブルを `hyakuryu_skill_names` データから読み込む。
 * `loadDataset` のメモリキャッシュにより、2 回目以降は再取得しない。
 */
export function loadHyakuryuSkillNames(): Promise<HyakuryuSkillNameTable> {
  return loadDataset<HyakuryuSkillNameTable>("hyakuryu_skill_names");
}
