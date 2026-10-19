import { Link } from "@tanstack/react-router";
import { type MonsterResistanceItem, monsterResistanceTypes } from "@/shared/lib";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";
import { buildResistanceGroups, type ResistanceGroup } from "../model/resistances";

interface ResistancesPageProps {
  items: readonly MonsterResistanceItem[];
}

/**
 * 状態異常耐性ページ。状態異常ごとに、同じ耐性値（初期 / 上昇 / 最大）を持つ
 * モンスターをまとめた表を並べる。
 */
export function ResistancesPage({ items }: ResistancesPageProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">状態異常耐性</h1>
        <p className="text-sm text-muted-foreground">
          同じ耐性値（初期 / 上昇 / 最大）を持つモンスターを状態異常ごとにまとめた表です。
          行は初期耐性の昇順（効きやすい順）。
        </p>
      </div>
      {monsterResistanceTypes.map(({ key, label }) => (
        <section key={key} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{label}</h2>
          <ResistanceTable groups={buildResistanceGroups(items, key)} />
        </section>
      ))}
    </div>
  );
}

function ResistanceTable({ groups }: { groups: readonly ResistanceGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>初期耐性</TableHead>
          <TableHead className="text-right">上昇</TableHead>
          <TableHead className="text-right">最大</TableHead>
          <TableHead className="text-right">効果時間</TableHead>
          <TableHead className="text-right">体数</TableHead>
          <TableHead>モンスター</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => (
          <TableRow key={`${group.initial}/${group.add}/${group.max}`}>
            <TableCell className="font-medium">{group.initial}</TableCell>
            <TableCell className="text-right">+{group.add}</TableCell>
            <TableCell className="text-right">{group.max}</TableCell>
            <TableCell className="text-right">
              {group.active_time > 0 ? `${group.active_time} 秒` : "—"}
            </TableCell>
            <TableCell className="text-right">{group.monsters.length}</TableCell>
            <TableCell className="whitespace-normal">
              <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                {group.monsters.map((monster) => (
                  <li key={monster.id}>
                    <Link
                      to="/monsters/$monsterId"
                      params={{ monsterId: String(monster.id) }}
                      className="hover:underline"
                    >
                      {monster.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
