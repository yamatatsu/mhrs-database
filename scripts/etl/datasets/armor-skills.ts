import { asArray, isObject } from "../json.ts";
import { baseTransform } from "../slim.ts";
import type { Dataset } from "../types.ts";

/** 防具・スキル・装飾品カテゴリが引き受けるトップレベルキーの接頭辞。 */
const ARMOR_SKILLS_PREFIXES = [
  "armor",
  "overwear",
  "equip_skill",
  "player_skill",
  "hyakuryu_skill",
  "decorations",
  "hyakuryu_decos",
  "alchemy_pl_skill",
];

export const armorSkills: Dataset = {
  name: "armor_skills",
  match: (key) => ARMOR_SKILLS_PREFIXES.some((prefix) => key.startsWith(prefix)),
  transform: (group) => filterArmor(baseTransform(group)),
};

/** 無効な防具（is_valid = false。約 260 行）を除外する。 */
function filterArmor(group: Record<string, unknown>): Record<string, unknown> {
  const armor = group.armor;
  if (!isObject(armor)) return group;
  armor.param = asArray(armor.param).filter((row) => !isObject(row) || row.is_valid !== false);
  return group;
}
