import { Fragment } from "react";
import { cn } from "cn";
import { monsterHitzoneColumns, type MonsterDetail, type MonsterHitzoneGroup } from "@/shared/lib";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";
import {
  buildMonsterHitzoneRows,
  formatMonsterHitzoneValue,
  getMonsterHitzoneHeatLevel,
  hasMonsterHitzoneVariation,
  type MonsterHitzoneHeatLevel,
} from "../model/hitzone";

/** ヒートマップで色分けする列の分類（気絶などの `other` は対象外）。 */
type HeatmapGroup = Exclude<MonsterHitzoneGroup, "other">;

/** 物理は黄〜赤、属性は緑系。彩度と不透明度を抑えた配色にする。 */
const heatLevelClasses: Record<HeatmapGroup, Record<MonsterHitzoneHeatLevel, string>> = {
  physical: {
    none: "text-muted-foreground",
    low: "bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100/80",
    medium: "bg-amber-200/70 text-amber-950 dark:bg-amber-400/25 dark:text-amber-50",
    high: "bg-orange-300/70 text-orange-950 dark:bg-orange-500/35 dark:text-orange-50",
    severe: "bg-red-400/65 text-red-950 dark:bg-red-500/45 dark:text-red-50",
  },
  elemental: {
    none: "text-muted-foreground",
    low: "bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100/80",
    medium: "bg-emerald-200/70 text-emerald-950 dark:bg-emerald-400/25 dark:text-emerald-50",
    high: "bg-emerald-300/70 text-emerald-950 dark:bg-emerald-500/35 dark:text-emerald-50",
    severe: "bg-emerald-500/50 text-emerald-950 dark:bg-emerald-500/50 dark:text-emerald-50",
  },
};

const heatLegend: Record<
  HeatmapGroup,
  readonly { level: MonsterHitzoneHeatLevel; label: string }[]
> = {
  physical: [
    { level: "none", label: "0" },
    { level: "low", label: "1–24" },
    { level: "medium", label: "25–44" },
    { level: "high", label: "45–64" },
    { level: "severe", label: "65+" },
  ],
  elemental: [
    { level: "none", label: "0" },
    { level: "low", label: "1–9" },
    { level: "medium", label: "10–19" },
    { level: "high", label: "20–29" },
    { level: "severe", label: "30+" },
  ],
};

const physicalColumns = monsterHitzoneColumns.filter((column) => column.group === "physical");
const elementalColumns = monsterHitzoneColumns.filter((column) => column.group === "elemental");

/**
 * 肉質（部位ごとの弱点値）を表で表示する。
 * 物理（斬撃・打撃・砲撃）と属性（火・水・氷・雷・龍）は別々のルールで色分けし、
 * 効果が高い部位を目立たせる。気絶は参考値として色分けせずに表示する。
 * 相によって値が変わる部位は、相ごとの値を `/` 区切り（左から相の順）で表示する。
 */
export function MonsterHitzoneTable({ detail }: { detail: MonsterDetail }) {
  const rows = buildMonsterHitzoneRows(detail);
  if (rows.length === 0) return null;
  const hasVariation = hasMonsterHitzoneVariation(rows);

  return (
    <div className="flex flex-col gap-2">
      <HitzoneLegend />
      {hasVariation ? (
        <p className="text-xs text-muted-foreground">
          相によって値が変わる部位は、相ごとの値を <span className="font-mono">/</span>{" "}
          区切りで表示します（左から相の順）。セルの色は最も高い値で決まります。
        </p>
      ) : null}
      <Table className="w-auto">
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2}>部位</TableHead>
            <TableHead
              colSpan={physicalColumns.length}
              className="text-center text-xs text-muted-foreground"
            >
              物理
            </TableHead>
            <TableHead rowSpan={2} className="w-3 min-w-3 p-0" aria-hidden="true" />
            <TableHead
              colSpan={elementalColumns.length}
              className="text-center text-xs text-muted-foreground"
            >
              属性
            </TableHead>
            <TableHead rowSpan={2} className="w-3 min-w-3 p-0" aria-hidden="true" />
            <TableHead rowSpan={2} className="text-right text-muted-foreground">
              気絶
            </TableHead>
          </TableRow>
          <TableRow>
            {physicalColumns.map((column) => (
              <TableHead key={column.key} className="text-right">
                {column.label}
              </TableHead>
            ))}
            {elementalColumns.map((column) => (
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
              {monsterHitzoneColumns.map((column, columnIndex) => {
                const value = row.values[columnIndex];
                return (
                  <Fragment key={column.key}>
                    {columnIndex === physicalColumns.length || column.group === "other" ? (
                      <TableCell className="w-3 min-w-3 p-0" aria-hidden="true" />
                    ) : null}
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        column.group === "other"
                          ? "text-muted-foreground"
                          : heatLevelClasses[column.group][
                              getMonsterHitzoneHeatLevel(value, column.group)
                            ],
                      )}
                      title={
                        value.kind === "multiple"
                          ? `相ごとの値: ${value.values.join(" / ")}`
                          : undefined
                      }
                    >
                      {formatMonsterHitzoneValue(value)}
                    </TableCell>
                  </Fragment>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** 物理・属性それぞれの色と肉質値の対応を示す凡例。 */
function HitzoneLegend() {
  return (
    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
      <HeatLegendRow group="physical" label="物理" note="45 以上が弱点の目安" />
      <HeatLegendRow group="elemental" label="属性" note="20 以上が弱点の目安" />
      <span>気絶はヒートマップ対象外（参考値）</span>
    </div>
  );
}

function HeatLegendRow({
  group,
  label,
  note,
}: {
  group: HeatmapGroup;
  label: string;
  note: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-medium text-foreground">{label}</span>
      {heatLegend[group].map(({ level, label: range }) => (
        <span key={level} className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className={cn(
              "inline-block size-3 rounded-sm",
              level === "none" && "ring-1 ring-border ring-inset",
              heatLevelClasses[group][level],
            )}
          />
          {range}
        </span>
      ))}
      <span>{note}</span>
    </div>
  );
}
