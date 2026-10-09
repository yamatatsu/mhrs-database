import { baseTransform } from "../slim.ts";
import type { Dataset } from "../types.ts";

/** クエストカテゴリが引き受けるトップレベルキーの接頭辞。 */
const QUEST_PREFIXES = [
  "quest",
  "normal_quest",
  "dl_quest",
  "arena_quest",
  "difficulty",
  "reward",
  "mystery_reward",
  "main_target",
  "fixed_hyakuryu",
  "supply_data",
  "time_attack",
  "talk_condition",
  "npc_mission",
  "progress",
];

export const quests: Dataset = {
  name: "quests",
  match: (key) => QUEST_PREFIXES.some((prefix) => key.startsWith(prefix)),
  // クエストはテストデータが無いため、現状は共通処理のみ。
  transform: (group) => [{ id: "quests", data: baseTransform(group) }],
};
