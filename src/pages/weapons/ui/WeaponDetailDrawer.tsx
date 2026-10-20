import { useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import {
  getHyakuryuSkillName,
  getItemName,
  getMaterialCategoryName,
  getWeaponBulletLabel,
  getWeaponBullets,
  getWeaponDetailElements,
  getWeaponElementLabel,
  getWeaponFluctuationLabel,
  type HyakuryuSkillNameTable,
  type ItemNameTable,
  type WeaponBullet,
  type WeaponDetail,
  type WeaponIndexItem,
  type WeaponRecipe,
  type WeaponRecipes,
  type WeaponType,
} from "@/shared/lib";
import { buildWeaponTree, type WeaponTreeNode } from "../model/derivation";
import {
  Badge,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui";
import { SharpnessBar } from "./SharpnessBar";

interface WeaponDetailDrawerProps {
  weaponType: WeaponType;
  detail: WeaponDetail;
  /** 派生ツリーの組み立てに使う、同じ武器種の一覧。 */
  list: readonly WeaponIndexItem[];
  itemNames: ItemNameTable;
  /** 百竜スキル名の解決に使う参照テーブル。 */
  hyakuryuSkillNames: HyakuryuSkillNameTable;
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
  hyakuryuSkillNames,
}: WeaponDetailDrawerProps) {
  const navigate = useNavigate();
  const indexById = new Map(list.map((weapon) => [weapon.id, weapon]));

  const indexed = indexById.get(detail.id);
  const elements = indexed?.elements ?? getWeaponDetailElements(detail);
  const sharpness = indexed?.sharpness_val_list ?? detail.sharpness_val_list ?? [];
  const derivationTree = useMemo(() => buildWeaponTree(list, detail.id), [list, detail.id]);

  return (
    <Sheet
      open
      modal={false}
      onOpenChange={(open) => {
        if (!open) {
          void navigate({
            to: "/weapons/$weaponType",
            params: { weaponType: weaponType.id },
            replace: true,
            resetScroll: false,
          });
        }
      }}
    >
      <SheetContent
        side="right"
        showOverlay={false}
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="pr-14">
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
          <AmmoSection detail={detail} />
          <HyakuryuSection detail={detail} hyakuryuSkillNames={hyakuryuSkillNames} />
          <RecipesSection recipes={detail.recipes} itemNames={itemNames} />
          {derivationTree && derivationTree.children.length > 0 ? (
            <Section title="派生ツリー">
              <DerivationTree tree={derivationTree} currentId={detail.id} weaponType={weaponType} />
            </Section>
          ) : null}
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
        {isGunner(detail) ? (
          <>
            <Stat label="ブレ" value={getWeaponFluctuationLabel(detail.fluctuation)} />
            <Stat label="リロード" value={detail.reload ?? "—"} />
            <Stat label="反動" value={detail.recoil ?? "—"} />
            {detail.unique_bullet ? (
              <Stat label="特殊弾" value={getWeaponBulletLabel(detail.unique_bullet)} />
            ) : null}
          </>
        ) : null}
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

/** ガンナー（ボウガン）の詳細か。弾の装填可否リストの有無で判定する。 */
function isGunner(detail: WeaponDetail): boolean {
  return detail.bullet_equip_flag_list !== undefined;
}

/** 射撃タイプのフラグを表示用の文字列へまとめる。 */
function shotTypeLabel(bullet: WeaponBullet): string {
  const labels: string[] = [];
  if (bullet.shotType.movingShot) labels.push("移動射撃");
  if (bullet.shotType.movingReload) labels.push("移動装填");
  if (bullet.shotType.singleAuto) labels.push("自動装填");
  return labels.length > 0 ? labels.join("・") : "—";
}

/** 使用可能な弾（弾種・装填数・射撃タイプ・速射）のテーブル。 */
function AmmoSection({ detail }: { detail: WeaponDetail }) {
  const bullets = getWeaponBullets(detail);
  if (bullets.length === 0) return null;

  return (
    <Section title="使用可能な弾">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>弾種</TableHead>
              <TableHead className="text-right">装填数</TableHead>
              <TableHead>射撃タイプ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bullets.map((bullet) => (
              <TableRow key={bullet.type}>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <span>{bullet.name}</span>
                    {bullet.rapid ? <Badge variant="secondary">速射</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{bullet.capacity}</TableCell>
                <TableCell className="text-muted-foreground">{shotTypeLabel(bullet)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
}

/** 百竜スキルと百竜スロット。武器共通のデータで、該当がなければ表示しない。 */
function HyakuryuSection({
  detail,
  hyakuryuSkillNames,
}: {
  detail: WeaponDetail;
  hyakuryuSkillNames: HyakuryuSkillNameTable;
}) {
  const skillIds = (detail.hyakuryu_skill_id_list ?? []).filter((id): id is number => id !== null);
  const slots = (detail.hyakuryu_slot_num_list ?? []).filter((level) => level > 0);
  if (skillIds.length === 0 && slots.length === 0) return null;

  return (
    <Section title="百竜スキル">
      {skillIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          {skillIds.map((id) => (
            <Badge key={id} variant="secondary">
              {getHyakuryuSkillName(hyakuryuSkillNames, id)}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">なし</p>
      )}
      {slots.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">百竜スロット</span>
          <span className="text-sm">{slots.map((level) => `Lv${level}`).join(" / ")}</span>
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
  /** アイテム詳細へリンクする id。素材カテゴリなど詳細ページが無い場合は `null`。 */
  readonly itemId: number | null;
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
    // 名称が引けない（＝アイテム詳細が存在しない）id はリンクしない。
    const linkable = itemNames.items[itemId] !== undefined;
    materials.push({
      key: `item-${itemId}`,
      itemId: linkable ? itemId : null,
      label: getItemName(itemNames, itemId),
      num,
    });
  });
  if (recipe.material_category !== null && recipe.material_category_num > 0) {
    materials.push({
      key: `category-${recipe.material_category}`,
      itemId: null,
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
          {material.itemId !== null ? (
            <Link
              to="/items/$itemId"
              params={{ itemId: String(material.itemId) }}
              className="text-primary hover:underline"
            >
              {material.label}
            </Link>
          ) : (
            <span>{material.label}</span>
          )}
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

function DerivationTree({
  tree,
  currentId,
  weaponType,
}: {
  tree: WeaponTreeNode;
  currentId: number;
  weaponType: WeaponType;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      <DerivationTreeNode node={tree} currentId={currentId} weaponType={weaponType} />
    </ul>
  );
}

/**
 * 派生ツリーの 1 ノード。現在表示中の武器を強調し、各ノードから
 * その武器の詳細へ移動できるようにする。
 */
function DerivationTreeNode({
  node,
  currentId,
  weaponType,
}: {
  node: WeaponTreeNode;
  currentId: number;
  weaponType: WeaponType;
}) {
  const isCurrent = node.weapon.id === currentId;

  return (
    <li>
      <Link
        to="/weapons/$weaponType/$weaponId"
        params={{ weaponType: weaponType.id, weaponId: String(node.weapon.id) }}
        resetScroll={false}
        aria-current={isCurrent ? "page" : undefined}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent",
          isCurrent && "bg-accent font-medium",
        )}
      >
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            isCurrent ? "bg-primary" : "bg-transparent",
          )}
          aria-hidden="true"
        />
        <span className="min-w-0 break-words">{node.weapon.name}</span>
      </Link>
      {node.children.length > 0 ? (
        <ul className="ml-1.5 flex flex-col gap-0.5 border-l border-border pl-1.5">
          {node.children.map((child) => (
            <DerivationTreeNode
              key={child.weapon.id}
              node={child}
              currentId={currentId}
              weaponType={weaponType}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
