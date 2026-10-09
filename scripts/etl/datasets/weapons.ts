import { getEntryJa } from "../filter.ts";
import { asArray, asNumber, isObject } from "../json.ts";
import { baseTransform } from "../slim.ts";
import type { Dataset } from "../types.ts";

/** 武器カテゴリが引き受けるトップレベルキー。 */
const WEAPON_KEYS = new Set([
  "great_sword",
  "short_sword",
  "hammer",
  "lance",
  "long_sword",
  "slash_axe",
  "gun_lance",
  "dual_blades",
  "horn",
  "insect_glaive",
  "charge_axe",
  "light_bowgun",
  "heavy_bowgun",
  "bow",
  "horn_melody",
  "horn_melody_mr",
  "hyakuryu_weapon_buildup",
  "weapon_chaos_critical",
  "weapon_series",
  "weapon_series_mr",
]);

interface WeaponTypeConfig {
  /** id struct のキー（例: GreatSword）。 */
  idKey: string;
  /** 近接武器は struct が 1 段深い（base.base.base.atk）。弓・ガンナーは浅い。 */
  deep: boolean;
}

const WEAPON_TYPES: Record<string, WeaponTypeConfig> = {
  great_sword: { idKey: "GreatSword", deep: true },
  long_sword: { idKey: "LongSword", deep: true },
  short_sword: { idKey: "ShortSword", deep: true },
  dual_blades: { idKey: "DualBlades", deep: true },
  hammer: { idKey: "Hammer", deep: true },
  horn: { idKey: "Horn", deep: true },
  lance: { idKey: "Lance", deep: true },
  gun_lance: { idKey: "GunLance", deep: true },
  slash_axe: { idKey: "SlashAxe", deep: true },
  charge_axe: { idKey: "ChargeAxe", deep: true },
  insect_glaive: { idKey: "InsectGlaive", deep: true },
  bow: { idKey: "Bow", deep: false },
  light_bowgun: { idKey: "LightBowgun", deep: false },
  heavy_bowgun: { idKey: "HeavyBowgun", deep: false },
};

/** 名称マスタの name 列（W_<武器種>_<id>_Name、一部 _Name_MR）から武器 id を抽出する。 */
const NAME_RE = /^W_\w+_(\d+)_Name(?:_MR)?$/;

export const weapons: Dataset = {
  name: "weapons",
  match: (key) => WEAPON_KEYS.has(key),
  transform: (group) => filterWeapons(baseTransform(group)),
};

/**
 * テスト用・未使用武器を除外する。
 * - 名称が「テスト」を含む / 名称が存在しない（#Rejected# は baseTransform で除去済み）
 * - 攻撃力 0 の重ね着専用ダミー（ロストコード／ぬいぐるみ系）
 * 派生ツリー（tree）・生産素材（product）はインデックス参照があるため温存する。
 */
function filterWeapons(group: Record<string, unknown>): Record<string, unknown> {
  for (const [weaponType, config] of Object.entries(WEAPON_TYPES)) {
    const weapon = group[weaponType];
    if (!isObject(weapon) || !isObject(weapon.base_data)) continue;

    const nameMap = buildWeaponNameMap(weapon);
    const baseData = weapon.base_data;
    const keptIds = new Set<number>();

    baseData.param = asArray(baseData.param).filter((row) => {
      const id = getWeaponId(row, config);
      if (id === undefined) return false;
      const name = nameMap.get(id);
      if (name === undefined || name.includes("テスト")) return false;
      const atk = getWeaponAtk(row, config);
      if (atk === undefined || atk <= 0) return false;
      keptIds.add(id);
      return true;
    });

    filterNameEntries(weapon.name, keptIds);
    filterNameEntries(weapon.name_mr, keptIds);
  }
  return group;
}

function buildWeaponNameMap(weapon: Record<string, unknown>): Map<number, string> {
  const map = new Map<number, string>();
  for (const key of ["name", "name_mr"]) {
    const container = weapon[key];
    if (!isObject(container)) continue;
    for (const entry of asArray(container.entries)) {
      if (!isObject(entry) || typeof entry.name !== "string") continue;
      const match = NAME_RE.exec(entry.name);
      if (!match) continue;
      const ja = getEntryJa(entry);
      if (ja !== undefined) map.set(Number(match[1]), ja);
    }
  }
  return map;
}

/** 名称テーブルを、残した武器 id のみに絞る（未使用枠もここで落ちる）。 */
function filterNameEntries(container: unknown, keptIds: Set<number>): void {
  if (!isObject(container)) return;
  container.entries = asArray(container.entries).filter((entry) => {
    if (!isObject(entry) || typeof entry.name !== "string") return false;
    const match = NAME_RE.exec(entry.name);
    return match !== null && keptIds.has(Number(match[1]));
  });
}

function getWeaponStats(
  row: unknown,
  config: WeaponTypeConfig,
): Record<string, unknown> | undefined {
  const base1 = isObject(row) ? row.base : undefined;
  const base2 = isObject(base1) ? base1.base : undefined;
  if (!config.deep) return isObject(base2) ? base2 : undefined;
  const base3 = isObject(base2) ? base2.base : undefined;
  return isObject(base3) ? base3 : undefined;
}

function getWeaponId(row: unknown, config: WeaponTypeConfig): number | undefined {
  const stats = getWeaponStats(row, config);
  const ids = stats && isObject(stats.base) ? stats.base : undefined;
  const idStruct = ids && isObject(ids.id) ? ids.id : undefined;
  return idStruct ? asNumber(idStruct[config.idKey]) : undefined;
}

function getWeaponAtk(row: unknown, config: WeaponTypeConfig): number | undefined {
  const stats = getWeaponStats(row, config);
  return stats ? asNumber(stats.atk) : undefined;
}
