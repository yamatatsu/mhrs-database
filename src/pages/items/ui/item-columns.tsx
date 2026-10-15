import { createColumnHelper } from "@tanstack/react-table";
import { Badge, DataTableColumnHeader, type DataTableFeatures } from "@/shared/ui";
import type { ItemIndexItem } from "../model/items";

/**
 * アイテム一覧のカラム。行クリックで詳細へ遷移する（`ItemsPage` が `onRowClick` を渡す）。
 */
export function getItemColumns() {
  const columnHelper = createColumnHelper<DataTableFeatures, ItemIndexItem>();

  return columnHelper.columns([
    columnHelper.accessor((row) => row.name, {
      id: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="名前" />,
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    }),
    columnHelper.accessor((row) => row.rare, {
      id: "rare",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="レア度" className="justify-end" />
      ),
      cell: ({ getValue }) => <div className="text-right">{getValue()}</div>,
    }),
    columnHelper.accessor((row) => row.type, {
      id: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="分類" />,
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
    }),
    columnHelper.accessor((row) => row.pl_max_count, {
      id: "pl_max_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="所持上限" className="justify-end" />
      ),
      cell: ({ getValue }) => <div className="text-right">{getValue()}</div>,
    }),
    columnHelper.accessor((row) => row.sell_price, {
      id: "sell_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="売値" className="justify-end" />
      ),
      cell: ({ getValue }) => <div className="text-right">{getValue()}z</div>,
    }),
    columnHelper.accessor((row) => row.craftable, {
      id: "craftable",
      header: "調合",
      enableSorting: false,
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge variant="secondary">調合</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    }),
  ]);
}
