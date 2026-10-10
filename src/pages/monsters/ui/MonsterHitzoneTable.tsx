import {
  getMonsterPartLabel,
  monsterHitzoneColumns,
  type MonsterDetail,
  type MonsterMeatGroup,
} from "@/shared/lib";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";

interface HitzoneRow {
  index: number;
  part: string;
  groupIndex: number;
  group: MonsterMeatGroup;
}

/** 肉質（部位 × 状態ごとの弱点値）を表で表示する。 */
export function MonsterHitzoneTable({ detail }: { detail: MonsterDetail }) {
  const meatMap = detail.collider_mapping?.meat_map;
  const containers = detail.meat_data?.meat_container;
  if (!meatMap || !containers) return null;

  const rows: HitzoneRow[] = Object.entries(meatMap)
    .map(([index, names]) => ({ index: Number(index), names }))
    .sort((a, b) => a.index - b.index)
    .flatMap((entry) => {
      const groups = containers[entry.index]?.meat_group_info ?? [];
      return groups.map((group, groupIndex) => ({
        index: entry.index,
        part: getMonsterPartLabel(entry.names),
        groupIndex,
        group,
      }));
    });

  if (rows.length === 0) return null;
  const hasMultipleGroups = rows.some((row) => row.groupIndex > 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>部位</TableHead>
          {hasMultipleGroups ? <TableHead className="text-right">相</TableHead> : null}
          {monsterHitzoneColumns.map((column) => (
            <TableHead key={column.key} className="text-right">
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.index}-${row.groupIndex}`}>
            <TableCell className="font-medium">{row.part}</TableCell>
            {hasMultipleGroups ? (
              <TableCell className="text-right text-muted-foreground">{row.groupIndex}</TableCell>
            ) : null}
            {monsterHitzoneColumns.map((column) => (
              <TableCell key={column.key} className="text-right">
                {row.group[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
