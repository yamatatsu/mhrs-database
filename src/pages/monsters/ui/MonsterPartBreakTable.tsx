import type { MonsterDetail } from "@/shared/lib";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";

/**
 * 部位破壊の一覧を表で表示する。
 * 部位ごとに破壊段階（1 / 2）と切断可否を示す。切断のみの部位は段階を `—` にする。
 */
export function MonsterPartBreakTable({ detail }: { detail: MonsterDetail }) {
  const rows = detail.parts_break ?? [];
  if (rows.length === 0) return null;

  return (
    <Table className="w-auto">
      <TableHeader>
        <TableRow>
          <TableHead>部位</TableHead>
          <TableHead className="text-center">破壊段階</TableHead>
          <TableHead className="text-center">切断</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.part}>
            <TableCell className="font-medium">{row.part}</TableCell>
            <TableCell className="text-center">
              {row.level === null ? "—" : `${row.level}段階`}
            </TableCell>
            <TableCell className="text-center">{row.severable ? "可" : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
