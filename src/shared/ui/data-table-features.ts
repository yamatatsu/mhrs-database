import {
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * アプリのテーブルで使う TanStack Table v9 の機能セット。
 * ここに登録した機能だけがバンドルに含まれる（未登録の機能は tree-shake される）。
 * カラム定義は `ColumnDef<DataTableFeatures, TData>` の形でこの型を参照する。
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  // `sortFn: "auto"` の列が文字列のときに参照する。数値列は basic にフォールバックする。
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
  },
});

/** `dataTableFeatures` から導出した機能の型。カラム定義・列の型引数に渡す。 */
export type DataTableFeatures = typeof dataTableFeatures;
