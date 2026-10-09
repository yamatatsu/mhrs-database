import { createColumnHelper } from "@tanstack/react-table";
import { Badge, type DataTableFeatures } from "@/shared/ui";
import type { HornIndexItem } from "../model/horn";
import { getCoreColumns, getElementColumns, getSharpnessColumn } from "./weapon-columns";

/**
 * 狩猟笛のカラム。共通カラムの右端（切れ味の右側）に旋律カラムを追加する。
 * 3 つの旋律は横に並べる。
 */
export function getHornColumns() {
  const columnHelper = createColumnHelper<DataTableFeatures, HornIndexItem>();

  return [
    ...getCoreColumns<HornIndexItem>(),
    ...getElementColumns<HornIndexItem>(),
    ...getSharpnessColumn<HornIndexItem>(),
    columnHelper.display({
      id: "melodies",
      header: "旋律",
      cell: ({ row }) => (
        <div className="flex flex-row items-center gap-1">
          {row.original.melodies.map((melody) => (
            <Badge key={melody.id} variant="secondary">
              {melody.name}
            </Badge>
          ))}
        </div>
      ),
    }),
  ];
}
