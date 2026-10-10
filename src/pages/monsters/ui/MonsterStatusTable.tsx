import { type MonsterDetail, monsterStatusTypes } from "@/shared/lib";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";

interface StatusRow {
  label: string;
  initial: number;
  add: number;
  max: number;
  activeTime: number;
}

/** 状態異常の耐性値・効果時間を表で表示する。 */
export function MonsterStatusTable({ detail }: { detail: MonsterDetail }) {
  const data = detail.condition_damage_data;
  if (!data) return null;

  const rows: StatusRow[] = monsterStatusTypes.flatMap(({ key, label }) => {
    const condition = data[key];
    if (!condition) return [];
    const stock = condition.default_stock;
    return [
      {
        label,
        initial: stock.default_limit,
        add: stock.add_limit,
        max: stock.max_limit,
        activeTime: condition.active_time,
      },
    ];
  });

  if (rows.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>状態異常</TableHead>
          <TableHead className="text-right">初期耐性</TableHead>
          <TableHead className="text-right">上昇</TableHead>
          <TableHead className="text-right">最大</TableHead>
          <TableHead className="text-right">効果時間</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell className="font-medium">{row.label}</TableCell>
            <TableCell className="text-right">{row.initial}</TableCell>
            <TableCell className="text-right">+{row.add}</TableCell>
            <TableCell className="text-right">{row.max}</TableCell>
            <TableCell className="text-right">{row.activeTime} 秒</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
