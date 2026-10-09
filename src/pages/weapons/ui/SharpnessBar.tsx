/**
 * 切れ味バーの最大値。全武器共通のスケールで、値はこの合計を 100% として描画する
 * （`sharpness_val_list` の合計の最大値が 400）。
 */
const SHARPNESS_MAX = 400;

/** 切れ味の色（赤 / 橙 / 黄 / 緑 / 青 / 白 / 紫）。`sharpness_val_list` と同じ並び。 */
const SHARPNESS_COLORS = [
  "bg-red-600",
  "bg-orange-500",
  "bg-yellow-400",
  "bg-emerald-500",
  "bg-blue-600",
  "bg-neutral-100",
  "bg-fuchsia-600",
] as const;

interface SharpnessBarProps {
  /** `sharpness_val_list`（色ごとの値。この順で赤→紫）。 */
  values: readonly number[];
}

/** 切れ味を色ごとの横棒として積み上げて表示する。残りは黒（未到達領域）。 */
export function SharpnessBar({ values }: SharpnessBarProps) {
  return (
    <div className="flex h-3 w-40 overflow-hidden rounded-[2px] bg-black">
      {SHARPNESS_COLORS.map((color, index) => {
        const value = values[index] ?? 0;
        if (value <= 0) return null;
        return (
          <div
            key={color}
            className={color}
            style={{ width: `${(value / SHARPNESS_MAX) * 100}%` }}
          />
        );
      })}
    </div>
  );
}
