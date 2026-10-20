import { createColumnHelper } from "@tanstack/react-table";
import { getWeaponElementLabel, type WeaponIndexItem, type WeaponType } from "@/shared/lib";
import { type DataTableFeatures } from "@/shared/ui";
import { SharpnessBar } from "./SharpnessBar";

/**
 * 名前 / 攻撃力 / 会心率。全武器種で共通のカラム。
 *
 * カラムは `TData extends WeaponIndexItem` に対して定義し、武器種固有フィールドを持つ
 * 拡張型（例: `HornIndexItem`）でもそのまま使えるようにする。
 */
export function getCoreColumns<TData extends WeaponIndexItem>() {
  const columnHelper = createColumnHelper<DataTableFeatures, TData>();

  return columnHelper.columns([
    columnHelper.accessor((row) => row.name, {
      id: "name",
      header: "名前",
      enableSorting: false,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    }),
    columnHelper.accessor((row) => row.atk, {
      id: "atk",
      header: () => <div className="text-right">攻撃力</div>,
      enableSorting: false,
      cell: ({ getValue }) => <div className="text-right">{getValue()}</div>,
    }),
    columnHelper.accessor((row) => row.critical_rate, {
      id: "critical_rate",
      header: () => <div className="text-right">会心率</div>,
      enableSorting: false,
      cell: ({ getValue }) => <div className="text-right">{getValue()}%</div>,
    }),
  ]);
}

/** 属性 / 属性値。属性を持たない武器種（ライト・ヘビィボウガン）では使わない。 */
export function getElementColumns<TData extends WeaponIndexItem>() {
  const columnHelper = createColumnHelper<DataTableFeatures, TData>();

  return columnHelper.columns([
    columnHelper.accessor((row) => row.elements, {
      id: "elements",
      header: "属性",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.elements.length > 0 ? (
          row.original.elements.map((element) => getWeaponElementLabel(element.type)).join(" / ")
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    }),
    columnHelper.accessor((row) => row.elements, {
      id: "element_values",
      header: () => <div className="text-right">属性値</div>,
      enableSorting: false,
      cell: ({ row }) =>
        row.original.elements.length > 0 ? (
          <div className="text-right">
            {row.original.elements.map((element) => element.value).join(" / ")}
          </div>
        ) : (
          <div className="text-right text-muted-foreground">—</div>
        ),
    }),
  ]);
}

/** 切れ味。切れ味を持たない武器種（弓・ガンナー）では使わない。 */
export function getSharpnessColumn<TData extends WeaponIndexItem>() {
  const columnHelper = createColumnHelper<DataTableFeatures, TData>();

  return columnHelper.columns([
    columnHelper.accessor((row) => row.sharpness_val_list, {
      id: "sharpness_val_list",
      header: "切れ味",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.sharpness_val_list.length > 0 ? (
          <SharpnessBar values={row.original.sharpness_val_list} />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    }),
  ]);
}

/** 武器種ごとに共通カラム（属性・切れ味）を表示するかどうか。 */
interface WeaponColumnLayout {
  /** 属性・属性値カラムを表示するか。 */
  readonly elements: boolean;
  /** 切れ味カラムを表示するか。 */
  readonly sharpness: boolean;
}

const DEFAULT_WEAPON_COLUMN_LAYOUT: WeaponColumnLayout = { elements: true, sharpness: true };

/**
 * 武器種ごとのカラム構成。指定のない武器種は属性・切れ味を表示する。
 * - 弓: 切れ味を持たない。
 * - ライト・ヘビィボウガン: 属性・属性値・切れ味を持たない。
 */
const WEAPON_COLUMN_LAYOUTS: Partial<Record<WeaponType["id"], WeaponColumnLayout>> = {
  bow: { elements: true, sharpness: false },
  light_bowgun: { elements: false, sharpness: false },
  heavy_bowgun: { elements: false, sharpness: false },
};

/**
 * 武器種に応じた共通カラムを組み立てる（武器種固有カラムは含まない）。
 * 武器種固有カラムを持つ場合は、これに追加する（例: `horn-columns.tsx`）。
 */
export function getWeaponColumns<TData extends WeaponIndexItem = WeaponIndexItem>(
  weaponType: WeaponType,
) {
  const layout = WEAPON_COLUMN_LAYOUTS[weaponType.id] ?? DEFAULT_WEAPON_COLUMN_LAYOUT;

  return [
    ...getCoreColumns<TData>(),
    ...(layout.elements ? getElementColumns<TData>() : []),
    ...(layout.sharpness ? getSharpnessColumn<TData>() : []),
  ];
}
