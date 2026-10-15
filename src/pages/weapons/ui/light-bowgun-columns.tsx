import { createColumnHelper } from "@tanstack/react-table";
import { getWeaponBulletLabel, getWeaponFluctuationLabel } from "@/shared/lib";
import { Badge, DataTableColumnHeader, type DataTableFeatures } from "@/shared/ui";
import type { LightBowgunIndexItem } from "../model/light-bowgun";
import { getCoreColumns } from "./weapon-columns";

/**
 * ライトボウガンのカラム。共通カラムの右端に速射・ブレ・リロード・反動を追加する。
 * 属性・切れ味を持たないため、その枠をガンナー性能に使う（data.md §5.4.4）。
 */
export function getLightBowgunColumns() {
  const columnHelper = createColumnHelper<DataTableFeatures, LightBowgunIndexItem>();

  const gunnerColumns = columnHelper.columns([
    columnHelper.accessor((row) => row.rapid_fire, {
      id: "rapid_fire",
      header: "速射",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.rapid_fire.length > 0 ? (
          <div className="flex flex-row flex-wrap items-center gap-1">
            {row.original.rapid_fire.map((bullet) => (
              <Badge key={bullet} variant="secondary">
                {getWeaponBulletLabel(bullet)}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    }),
    columnHelper.accessor((row) => row.deviation, {
      id: "deviation",
      header: "ブレ",
      enableSorting: false,
      cell: ({ row }) => getWeaponFluctuationLabel(row.original.deviation),
    }),
    columnHelper.accessor((row) => row.reload, {
      id: "reload",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="リロード" className="justify-end" />
      ),
      cell: ({ getValue }) => <div className="text-right">{getValue()}</div>,
    }),
    columnHelper.accessor((row) => row.recoil, {
      id: "recoil",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="反動" className="justify-end" />
      ),
      cell: ({ getValue }) => <div className="text-right">{getValue()}</div>,
    }),
  ]);

  return [...getCoreColumns<LightBowgunIndexItem>(), ...gunnerColumns];
}
