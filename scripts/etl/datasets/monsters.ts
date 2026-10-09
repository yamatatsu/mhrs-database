import { baseTransform } from "../slim.ts";
import type { Dataset } from "../types.ts";

/** モンスターカテゴリが引き受けるトップレベルキーの接頭辞。 */
const MONSTER_PREFIXES = [
  "monster",
  "small_monsters",
  "condition_preset",
  "parts_type",
  "hunter_note",
  "species",
  "enemy_rank",
  "random_scale",
  "size_list",
  "discover_em_set_data",
];

export const monsters: Dataset = {
  name: "monsters",
  match: (key) => MONSTER_PREFIXES.some((prefix) => key.startsWith(prefix)),
  // #Rejected# の説明文除去は baseTransform（全カテゴリ共通）で完結する。
  transform: (group) => baseTransform(group),
};
