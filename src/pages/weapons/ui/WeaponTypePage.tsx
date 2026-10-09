import type { WeaponType } from "@/shared/lib";
import { DataTable } from "@/shared/ui";
import type { WeaponListData } from "../api/load-weapon-list";
import { getHornColumns } from "./horn-columns";
import { getWeaponColumns } from "./weapon-columns";

interface WeaponTypePageProps {
  weaponType: WeaponType;
  list: WeaponListData;
}

/**
 * 武器種の一覧ページ。武器種ごとにカラムを差し替えつつ、テーブル自体は
 * `shared/ui` の汎用 `DataTable` を全武器種で流用する。
 */
export function WeaponTypePage({ weaponType, list }: WeaponTypePageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-bold">{weaponType.label}</h1>
        <span className="text-sm text-muted-foreground">{list.items.length} 件</span>
      </div>
      {list.kind === "horn" ? (
        <DataTable key={weaponType.id} columns={getHornColumns()} data={list.items} />
      ) : (
        <DataTable key={weaponType.id} columns={getWeaponColumns(weaponType)} data={list.items} />
      )}
    </div>
  );
}
