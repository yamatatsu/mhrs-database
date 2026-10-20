import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";
import type { FilterOption } from "../model/filter";

/** Radix Select は空文字の value を許可しないため、全件選択用の番兵値を使う。 */
const ALL_VALUE = "__all__";

interface WeaponFiltersProps {
  element: string | null;
  melody: string | null;
  rapidFire: string | null;
  elementOptions: readonly FilterOption[];
  melodyOptions: readonly FilterOption[];
  rapidFireOptions: readonly FilterOption[];
  /** いずれかの絞り込みが有効か。クリアボタンの表示に使う。 */
  hasActiveFilter: boolean;
  onElementChange: (value: string | null) => void;
  onMelodyChange: (value: string | null) => void;
  onRapidFireChange: (value: string | null) => void;
  onReset: () => void;
}

/**
 * 武器一覧の絞り込み。武器種に応じて属性・旋律・速射のセレクトを出し分ける。
 * 選択肢が多いため、チップではなくセレクトボックスを使う。
 */
export function WeaponFilters({
  element,
  melody,
  rapidFire,
  elementOptions,
  melodyOptions,
  rapidFireOptions,
  hasActiveFilter,
  onElementChange,
  onMelodyChange,
  onRapidFireChange,
  onReset,
}: WeaponFiltersProps) {
  const hasFilter =
    elementOptions.length > 0 || melodyOptions.length > 0 || rapidFireOptions.length > 0;
  if (!hasFilter) return null;

  return (
    <div className="flex flex-wrap items-end gap-2">
      {elementOptions.length > 0 ? (
        <FilterSelect
          label="属性"
          value={element}
          options={elementOptions}
          onChange={onElementChange}
        />
      ) : null}
      {melodyOptions.length > 0 ? (
        <FilterSelect
          label="旋律"
          value={melody}
          options={melodyOptions}
          onChange={onMelodyChange}
        />
      ) : null}
      {rapidFireOptions.length > 0 ? (
        <FilterSelect
          label="速射"
          value={rapidFire}
          options={rapidFireOptions}
          onChange={onRapidFireChange}
        />
      ) : null}
      {hasActiveFilter ? (
        <Button variant="ghost" size="sm" className="h-10 md:h-8" onClick={onReset}>
          クリア
        </Button>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly FilterOption[];
  onChange: (value: string | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <Select
        value={value ?? ALL_VALUE}
        onValueChange={(next) => onChange(next === ALL_VALUE ? null : next)}
      >
        <SelectTrigger
          aria-label={label}
          className="h-10 w-40 max-w-full text-base data-[size=default]:h-10 md:h-8 md:text-sm md:data-[size=default]:h-8"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          className="max-h-72 min-w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]"
        >
          <SelectItem value={ALL_VALUE} className="py-2.5 md:py-1">
            すべて
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="py-2.5 md:py-1">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
