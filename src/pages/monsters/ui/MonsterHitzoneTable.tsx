import { monsterHitzoneColumns, type MonsterDetail } from "@/shared/lib";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";
import {
  buildMonsterHitzoneRows,
  formatMonsterHitzoneValue,
  hasMonsterHitzoneVariation,
} from "../model/hitzone";

/**
 * 肉質（部位ごとの弱点値）を表で表示する。
 * 相によって値が変わる部位は、相ごとの値を `/` 区切り（左から相の順）で表示する。
 */
export function MonsterHitzoneTable({ detail }: { detail: MonsterDetail }) {
  const rows = buildMonsterHitzoneRows(detail);
  if (rows.length === 0) return null;
  const hasVariation = hasMonsterHitzoneVariation(rows);

  return (
    <div className="flex flex-col gap-2">
      {hasVariation ? (
        <p className="text-xs text-muted-foreground">
          相によって値が変わる部位は、相ごとの値を <span className="font-mono">/</span>{" "}
          区切りで表示します（左から相の順）。
        </p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>部位</TableHead>
            {monsterHitzoneColumns.map((column) => (
              <TableHead key={column.key} className="text-right">
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.index}>
              <TableCell className="font-medium">{row.part}</TableCell>
              {monsterHitzoneColumns.map((column, columnIndex) => (
                <TableCell key={column.key} className="text-right">
                  {formatMonsterHitzoneValue(row.values[columnIndex])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
