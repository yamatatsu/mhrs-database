import { getEntryJa } from "../filter.ts";
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
  transform: (group) => {
    const data = filterArmor(baseTransform(group));
    return [
      { id: "armor_skills", data },
      // 武器詳細の百竜スキル表示用に、id → 日本語名だけを抜き出した軽量ファイル。
      { id: "hyakuryu_skill_names", data: buildHyakuryuSkillNames(data) },
    ];
  },
};

/** 百竜スキル名マスタの name 列（`HyakuryuSkill_<id>_Name`、MR は `_Name_MR`）から id を抽出する。 */
const HYAKURYU_SKILL_NAME_RE = /^HyakuryuSkill_(\d+)_Name(?:_MR)?$/;

/** 百竜スキル id → 日本語名の参照テーブルを作る。 */
function buildHyakuryuSkillNames(data: Record<string, unknown>): Record<number, string> {
  const names: Record<number, string> = {};
  collectHyakuryuSkillNames(data.hyakuryu_skill_name_msg, names);
  collectHyakuryuSkillNames(data.hyakuryu_skill_name_msg_mr, names);
  return names;
}

function collectHyakuryuSkillNames(container: unknown, out: Record<number, string>): void {
  if (!isObject(container)) return;
  for (const entry of asArray(container.entries)) {
    if (!isObject(entry) || typeof entry.name !== "string") continue;
    const match = HYAKURYU_SKILL_NAME_RE.exec(entry.name);
    if (!match) continue;
    const ja = getEntryJa(entry);
    if (ja !== undefined) out[Number(match[1])] = ja;
  }
}

/** 無効な防具（is_valid = false。約 260 行）を除外する。 */
function filterArmor(group: Record<string, unknown>): Record<string, unknown> {
  const armor = group.armor;
  if (!isObject(armor)) return group;
  armor.param = asArray(armor.param).filter((row) => !isObject(row) || row.is_valid !== false);
  return group;
}
