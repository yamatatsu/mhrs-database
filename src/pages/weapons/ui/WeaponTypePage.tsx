import type { WeaponIndexItem, WeaponType } from "@/shared/lib";
import { DataTable } from "@/shared/ui";
import type { WeaponListData } from "../api/load-weapon-list";
import { getHornColumns } from "./horn-columns";
import { getLightBowgunColumns } from "./light-bowgun-columns";
import { getWeaponColumns } from "./weapon-columns";

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
 */
export function WeaponTypePage({
  weaponType,
  list,
  selectedWeaponId,
  onSelectWeapon,
}: WeaponTypePageProps) {
  const rowInteraction = {
    onRowClick: onSelectWeapon,
    getRowClassName: (weapon: WeaponIndexItem) =>
      weapon.id === selectedWeaponId ? "bg-muted" : undefined,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-bold">{weaponType.label}</h1>
        <span className="text-sm text-muted-foreground">{list.items.length} 件</span>
      </div>
      {list.kind === "horn" ? (
        <DataTable
          key={weaponType.id}
          columns={getHornColumns()}
          data={list.items}
          {...rowInteraction}
        />
      ) : list.kind === "light_bowgun" ? (
        <DataTable
          key={weaponType.id}
          columns={getLightBowgunColumns()}
          data={list.items}
          {...rowInteraction}
        />
      ) : (
        <DataTable
          key={weaponType.id}
          columns={getWeaponColumns(weaponType)}
          data={list.items}
          {...rowInteraction}
        />
      )}
    </div>
  );
}
