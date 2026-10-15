/**
 * 百竜スキルの id → 名称を引くための参照テーブル。
 * 武器詳細の百竜スキルは id で保持されるため、表示時に `hyakuryu_skill_names`
 * データから構築したこのテーブルで名称へ解決する。
 */
export type HyakuryuSkillNameTable = Readonly<Record<number, string>>;

/** 百竜スキル id から日本語名を引く。未登録は `#<id>` にフォールバックする。 */
export function getHyakuryuSkillName(table: HyakuryuSkillNameTable, id: number): string {
  return table[id] ?? `#${id}`;
}
