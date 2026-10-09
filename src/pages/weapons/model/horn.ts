import type { WeaponIndexItem } from "@/shared/lib";

/** 狩猟笛の旋律 1 件。ETL が `horn_melody_type_list` に名称を join したもの（data.md §5.4.3）。 */
export interface WeaponMelody {
  /** 旋律 id。 */
  readonly id: number;
  /** 旋律名（日本語）。 */
  readonly name: string;
}

/**
 * 狩猟笛の一覧インデックス。他武器種の index には `melodies` が存在しないため、
 * 狩猟笛のときだけこの型として扱う（`load-weapon-list.ts`）。
 */
export interface HornIndexItem extends WeaponIndexItem {
  /** 旋律（ETL で名称まで解決済み）。 */
  readonly melodies: readonly WeaponMelody[];
}
