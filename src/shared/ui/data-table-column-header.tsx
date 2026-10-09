import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "./button";
import type { DataTableFeatures } from "./data-table-features";

interface DataTableColumnHeaderProps<TData extends RowData, TValue> {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
  /** 右寄せなど、外側の寄せ方を調整するためのクラス。 */
  className?: string;
}

/**
 * ソート可能なカラムヘッダー。クリックで 昇順 → 降順 → 未ソート（既定順）を巡回する。
 * ソート不可の列はただのテキストを返す。
 */
export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8"
        onClick={() => {
          if (sorted === "asc") {
            column.toggleSorting(true);
          } else if (sorted === "desc") {
            column.clearSorting();
          } else {
            column.toggleSorting(false);
          }
        }}
      >
        {title}
        {sorted === "asc" ? (
          <ArrowUpIcon />
        ) : sorted === "desc" ? (
          <ArrowDownIcon />
        ) : (
          <ChevronsUpDownIcon />
        )}
      </Button>
    </div>
  );
}
