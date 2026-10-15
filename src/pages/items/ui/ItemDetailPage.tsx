import { Link } from "@tanstack/react-router";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";
import type { ItemDetail, ItemMixRecipe, ItemMixUsage, ItemShopEntry } from "../model/items";

interface ItemDetailPageProps {
  detail: ItemDetail;
}

/** アイテム詳細ページ。基本情報・説明・調合・購入条件を表示する。 */
export function ItemDetailPage({ detail }: ItemDetailPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link to="/items" className="text-sm text-muted-foreground hover:underline">
          ← アイテム一覧
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{detail.name}</h1>
          <Badge variant="secondary">{detail.type}</Badge>
          <Badge variant="outline">レア度 {detail.rare}</Badge>
        </div>
      </div>

      <Section title="基本情報">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <Stat label="分類" value={detail.type} />
          <Stat label="レア度" value={detail.rare} />
          <Stat label="所持上限" value={detail.pl_max_count} />
          <Stat label="売値" value={`${detail.sell_price}z`} />
          <Stat label="買値" value={`${detail.buy_price}z`} />
        </dl>
        {detail.material_categories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <span className="text-muted-foreground">素材カテゴリ:</span>
            {detail.material_categories.map((category) => (
              <Badge key={category} variant="outline">
                {category}
              </Badge>
            ))}
          </div>
        ) : null}
      </Section>

      {detail.description ? (
        <Section title="説明">
          <p className="text-sm leading-relaxed whitespace-pre-line">{detail.description}</p>
        </Section>
      ) : null}

      {detail.mix_as_product.length > 0 ? (
        <Section title="このアイテムを作る">
          <MixAsProductTable recipes={detail.mix_as_product} />
        </Section>
      ) : null}

      {detail.mix_as_ingredient.length > 0 ? (
        <Section title="このアイテムを使う調合">
          <MixAsIngredientTable name={detail.name} usages={detail.mix_as_ingredient} />
        </Section>
      ) : null}

      <Section title="購入">
        {detail.shop ? (
          <ShopInfo shop={detail.shop} />
        ) : (
          <p className="text-sm text-muted-foreground">雑貨屋では購入できません。</p>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
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

/** このアイテムを作るレシピ（材料 → 完成品×個数）。 */
function MixAsProductTable({ recipes }: { recipes: readonly ItemMixRecipe[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>材料</TableHead>
          <TableHead className="text-right">個数</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recipes.map((recipe, index) => (
          <TableRow key={index}>
            <TableCell>{recipe.ingredients.join(" + ")}</TableCell>
            <TableCell className="text-right">×{recipe.num}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** このアイテムを材料に使うレシピ（材料 → 完成品×個数）。 */
function MixAsIngredientTable({ name, usages }: { name: string; usages: readonly ItemMixUsage[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>材料</TableHead>
          <TableHead>完成品</TableHead>
          <TableHead className="text-right">個数</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usages.map((usage, index) => (
          <TableRow key={index}>
            <TableCell>{[name, ...usage.with].join(" + ")}</TableCell>
            <TableCell className="font-medium">{usage.result}</TableCell>
            <TableCell className="text-right">×{usage.num}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** 雑貨屋の購入条件。進度がすべて 0（＝最初から）なら「最初から購入可能」と表示する。 */
function ShopInfo({ shop }: { shop: ItemShopEntry }) {
  const conditions: string[] = [];
  if (shop.village !== null && shop.village > 0) conditions.push(`村★${shop.village}`);
  if (shop.hall !== null && shop.hall > 0) conditions.push(`集会所★${shop.hall}`);
  if (shop.mr !== null && shop.mr > 0) conditions.push(`MR★${shop.mr}`);

  return (
    <p className="text-sm">
      {conditions.length > 0 ? (
        <>雑貨屋で購入可能（解放条件: {conditions.join(" / ")}）</>
      ) : (
        "雑貨屋で最初から購入可能"
      )}
    </p>
  );
}
