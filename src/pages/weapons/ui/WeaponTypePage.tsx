import { useMemo, useState } from "react";
import type { WeaponIndexItem, WeaponType } from "@/shared/lib";
import { DataTable } from "@/shared/ui";
import type { WeaponListData } from "../api/load-weapon-list";
import {
  getElementFilterOptions,
  getMelodyFilterOptions,
  getRapidFireFilterOptions,
  matchesElement,
} from "../model/filter";
import { getHornColumns } from "./horn-columns";
import { getLightBowgunColumns } from "./light-bowgun-columns";
import { getWeaponColumns } from "./weapon-columns";
import { WeaponFilters } from "./WeaponFilters";

interface WeaponTypePageProps {
  weaponType: WeaponType;
  list: WeaponListData;
  /** 詳細ドロワーで選択中の武器 id。一覧のハイライトに使う。 */
  selectedWeaponId?: number;
  /** 行クリックで武器を選択する。指定すると行がクリック可能になる。 */
  onSelectWeapon?: (weapon: WeaponIndexItem) => void;
}

/**
 * 武器種の一覧ページ。武器種ごとにカラムを差し替えつつ、テーブル自体は
 * `shared/ui` の汎用 `DataTable` を全武器種で流用する。
 * 属性・旋律・速射の絞り込みはページ内の状態で行う。
 */
export function WeaponTypePage({
  weaponType,
  list,
  selectedWeaponId,
  onSelectWeapon,
}: WeaponTypePageProps) {
  const [element, setElement] = useState<string | null>(null);
  const [melody, setMelody] = useState<string | null>(null);
  const [rapidFire, setRapidFire] = useState<string | null>(null);

  const elementOptions = useMemo(() => getElementFilterOptions(list.items), [list]);
  const melodyOptions = useMemo(
    () => (list.kind === "horn" ? getMelodyFilterOptions(list.items) : []),
    [list],
  );
  const rapidFireOptions = useMemo(
    () => (list.kind === "light_bowgun" ? getRapidFireFilterOptions(list.items) : []),
    [list],
  );

  const filteredHorn = useMemo(
    () =>
      list.kind === "horn"
        ? list.items.filter(
            (item) =>
              matchesElement(item, element) &&
              (melody === null || item.melodies.some((entry) => String(entry.id) === melody)),
          )
        : [],
    [list, element, melody],
  );

  const filteredLightBowgun = useMemo(
    () =>
      list.kind === "light_bowgun"
        ? list.items.filter(
            (item) =>
              matchesElement(item, element) &&
              (rapidFire === null || item.rapid_fire.includes(rapidFire)),
          )
        : [],
    [list, element, rapidFire],
  );

  const filteredStandard = useMemo(
    () =>
      list.kind === "standard" ? list.items.filter((item) => matchesElement(item, element)) : [],
    [list, element],
  );

  const filteredCount =
    list.kind === "horn"
      ? filteredHorn.length
      : list.kind === "light_bowgun"
        ? filteredLightBowgun.length
        : filteredStandard.length;

  const hasActiveFilter =
    element !== null ||
    (list.kind === "horn" && melody !== null) ||
    (list.kind === "light_bowgun" && rapidFire !== null);

  const rowInteraction = {
    onRowClick: onSelectWeapon,
    getRowClassName: (weapon: WeaponIndexItem) =>
      weapon.id === selectedWeaponId ? "bg-muted" : undefined,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-bold">{weaponType.label}</h1>
        <span className="text-sm text-muted-foreground">
          {filteredCount} 件{hasActiveFilter ? ` / ${list.items.length} 件` : ""}
        </span>
      </div>
      <WeaponFilters
        element={element}
        melody={melody}
        rapidFire={rapidFire}
        elementOptions={elementOptions}
        melodyOptions={melodyOptions}
        rapidFireOptions={rapidFireOptions}
        hasActiveFilter={hasActiveFilter}
        onElementChange={setElement}
        onMelodyChange={setMelody}
        onRapidFireChange={setRapidFire}
        onReset={() => {
          setElement(null);
          setMelody(null);
          setRapidFire(null);
        }}
      />
      {list.kind === "horn" ? (
        <DataTable
          key={weaponType.id}
          columns={getHornColumns()}
          data={filteredHorn}
          {...rowInteraction}
        />
      ) : list.kind === "light_bowgun" ? (
        <DataTable
          key={weaponType.id}
          columns={getLightBowgunColumns()}
          data={filteredLightBowgun}
          {...rowInteraction}
        />
      ) : (
        <DataTable
          key={weaponType.id}
          columns={getWeaponColumns(weaponType)}
          data={filteredStandard}
          {...rowInteraction}
        />
      )}
    </div>
  );
}
