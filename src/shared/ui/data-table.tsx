import { useState } from "react";
import { useTable, type ColumnDef, type RowData, type SortingState } from "@tanstack/react-table";
import { dataTableFeatures, type DataTableFeatures } from "./data-table-features";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

interface DataTableProps<TData extends RowData> {
  /** 表示するカラム。武器種ごとに差し替える。 */
  columns: ColumnDef<DataTableFeatures, TData>[];
  /** 表示する行データ。 */
  data: readonly TData[];
}

/**
 * TanStack Table v9 と shadcn の `Table` を組み合わせた汎用テーブル。
 * ドメイン知識は持たず、カラム定義とデータを props で受け取るだけ。
 * ソートはヘッダー操作で行い、未ソート時は受け取ったデータ順（武器は派生ツリー前順）を保つ。
 */
export function DataTable<TData extends RowData>({ columns, data }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                該当するデータがありません。
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
