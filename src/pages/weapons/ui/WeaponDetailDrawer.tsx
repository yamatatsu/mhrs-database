import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  getItemName,
  getMaterialCategoryName,
  getWeaponDetailElements,
  getWeaponElementLabel,
  type ItemNameTable,
  type WeaponDetail,
  type WeaponIndexItem,
  type WeaponRecipe,
  type WeaponRecipes,
  type WeaponTree,
  type WeaponType,
} from "@/shared/lib";
import { Badge, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui";
import { SharpnessBar } from "./SharpnessBar";

interface WeaponDetailDrawerProps {
  weaponType: WeaponType;
  detail: WeaponDetail;
  /** 派生ツリーの名称解決に使う、同じ武器種の一覧。 */
  list: readonly WeaponIndexItem[];
  itemNames: ItemNameTable;
}

/**
 * 武器詳細のドロワー。一覧の右側から開き、モバイルでは全幅（全画面相当）で表示する。
 * 開閉はルート（`/weapons/$weaponType/$weaponId`）で表現し、閉じると一覧ルートへ戻る。
 */
export function WeaponDetailDrawer({
  weaponType,
  detail,
  list,
  itemNames,
}: WeaponDetailDrawerProps) {
  const navigate = useNavigate();
  const indexById = new Map(list.map((weapon) => [weapon.id, weapon]));

  const indexed = indexById.get(detail.id);
  const elements = indexed?.elements ?? getWeaponDetailElements(detail);
  const sharpness = indexed?.sharpness_val_list ?? detail.sharpness_val_list ?? [];

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) {
          void navigate({
            to: "/weapons/$weaponType",
            params: { weaponType: weaponType.id },
            replace: true,
          });
        }
      }}
    >
      <SheetContent side="right" className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="pr-10">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle>{detail.name ?? "不明な武器"}</SheetTitle>
            <Badge variant="secondary">レア {detail.rare_type}</Badge>
          </div>
          <SheetDescription>{weaponType.label} の詳細</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
          <BasicInfoSection detail={detail} elements={elements} sharpness={sharpness} />
          {detail.description ? (
            <Section title="説明">
              <p className="text-sm leading-relaxed whitespace-pre-line">{detail.description}</p>
            </Section>
          ) : null}
          <RecipesSection recipes={detail.recipes} itemNames={itemNames} />
          <DerivationSection tree={detail.tree} indexById={indexById} weaponType={weaponType} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function BasicInfoSection({
  detail,
  elements,
  sharpness,
}: {
  detail: WeaponDetail;
  elements: readonly { type: string; value: number }[];
  sharpness: readonly number[];
}) {
  const slots = detail.slot_num_list.filter((level) => level > 0).sort((a, b) => b - a);

  return (
    <Section title="基本情報">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Stat label="レア度" value={detail.rare_type} />
        <Stat label="攻撃力" value={detail.atk} />
        <Stat label="会心率" value={`${detail.critical_rate}%`} />
        <Stat
          label="防御力"
          value={detail.def_bonus > 0 ? `+${detail.def_bonus}` : detail.def_bonus}
        />
        <Stat
          label="属性"
          value={
            elements.length > 0
              ? elements
                  .map((element) => `${getWeaponElementLabel(element.type)} ${element.value}`)
                  .join(" / ")
              : "—"
          }
        />
        <Stat
          label="スロット"
          value={slots.length > 0 ? slots.map((level) => `Lv${level}`).join(" / ") : "—"}
        />
      </dl>
      {sharpness.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">切れ味</span>
          <SharpnessBar values={sharpness} />
        </div>
      ) : null}
    </Section>
  );
}

/** レシピの種別と表示名。表示はこの順。 */
const RECIPE_KINDS = [
  { key: "product", label: "生産" },
  { key: "change", label: "強化" },
  { key: "process", label: "加工" },
] as const;

interface Material {
  readonly key: string;
  readonly label: string;
  readonly num: number;
}

/** レシピの素材を、アイテム名・素材カテゴリ名へ解決した一覧にまとめる。 */
function recipeMaterials(recipe: WeaponRecipe, itemNames: ItemNameTable): Material[] {
  const materials: Material[] = [];
  recipe.item.forEach((itemId, index) => {
    if (itemId === null) return;
    const num = recipe.item_num[index] ?? 0;
    if (num <= 0) return;
    materials.push({ key: `item-${itemId}`, label: getItemName(itemNames, itemId), num });
  });
  if (recipe.material_category !== null && recipe.material_category_num > 0) {
    materials.push({
      key: `category-${recipe.material_category}`,
      label: getMaterialCategoryName(itemNames, recipe.material_category),
      num: recipe.material_category_num,
    });
  }
  return materials;
}

function RecipeList({ recipe, itemNames }: { recipe: WeaponRecipe; itemNames: ItemNameTable }) {
  const materials = recipeMaterials(recipe, itemNames);
  if (materials.length === 0) {
    return <p className="text-sm text-muted-foreground">素材情報がありません。</p>;
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {materials.map((material) => (
        <li key={material.key} className="flex items-baseline justify-between gap-2 text-sm">
          <span>{material.label}</span>
          <span className="text-muted-foreground tabular-nums">×{material.num}</span>
        </li>
      ))}
    </ul>
  );
}

function RecipesSection({
  recipes,
  itemNames,
}: {
  recipes: WeaponRecipes;
  itemNames: ItemNameTable;
}) {
  const entries = RECIPE_KINDS.flatMap(({ key, label }) => {
    const recipe = recipes[key];
    return recipe ? [{ key, label, recipe }] : [];
  });

  return (
    <Section title="生産・強化">
      {entries.length > 0 ? (
        <div className="flex flex-col gap-3">
          {entries.map(({ key, label, recipe }) => (
            <div key={key} className="flex flex-col gap-1">
              <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
              <RecipeList recipe={recipe} itemNames={itemNames} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">レシピがありません。</p>
      )}
    </Section>
  );
}

function WeaponLink({ weapon, weaponType }: { weapon: WeaponIndexItem; weaponType: WeaponType }) {
  return (
    <Link
      to="/weapons/$weaponType/$weaponId"
      params={{ weaponType: weaponType.id, weaponId: String(weapon.id) }}
      className="text-sm text-primary hover:underline"
    >
      {weapon.name}
    </Link>
  );
}

function DerivationSection({
  tree,
  indexById,
  weaponType,
}: {
  tree: WeaponTree | null;
  indexById: ReadonlyMap<number, WeaponIndexItem>;
  weaponType: WeaponType;
}) {
  if (!tree) return null;
  const prev = tree.prev !== null ? indexById.get(tree.prev) : undefined;
  const next = tree.next.flatMap((id) => {
    const weapon = indexById.get(id);
    return weapon ? [weapon] : [];
  });
  if (!prev && next.length === 0) return null;

  return (
    <Section title="派生">
      {prev ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">1 つ前</span>
          <WeaponLink weapon={prev} weaponType={weaponType} />
        </div>
      ) : null}
      {next.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">派生先</span>
          <ul className="flex flex-col gap-0.5">
            {next.map((weapon) => (
              <li key={weapon.id}>
                <WeaponLink weapon={weapon} weaponType={weaponType} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  );
}
