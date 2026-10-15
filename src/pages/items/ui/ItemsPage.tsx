import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, DataTable, Input } from "@/shared/ui";
import type { ItemIndexItem } from "../model/items";
import { getItemColumns } from "./item-columns";

interface ItemsPageProps {
  list: readonly ItemIndexItem[];
}

/**
 * アイテム一覧ページ。名前の部分一致検索と分類フィルタ付きのテーブルを表示し、
 * 行クリックで詳細ページへ遷移する。
 */
export function ItemsPage({ list }: ItemsPageProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | null>(null);
  const keyword = query.trim().toLowerCase();

  const types = useMemo(() => [...new Set(list.map((item) => item.type))], [list]);

  const filtered = useMemo(
    () =>
      list.filter(
        (item) =>
          (type === null || item.type === type) &&
          (keyword === "" || item.name.toLowerCase().includes(keyword)),
      ),
    [list, keyword, type],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-bold">アイテム</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} 件</span>
      </div>
      <div className="flex flex-col gap-2">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="アイテム名で検索"
          aria-label="アイテム名で検索"
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-1">
          <Button
            variant={type === null ? "default" : "outline"}
            size="sm"
            onClick={() => setType(null)}
          >
            すべて
          </Button>
          {types.map((candidate) => (
            <Button
              key={candidate}
              variant={type === candidate ? "default" : "outline"}
              size="sm"
              onClick={() => setType(candidate)}
            >
              {candidate}
            </Button>
          ))}
        </div>
      </div>
      <DataTable
        columns={getItemColumns()}
        data={filtered}
        onRowClick={(item) =>
          void navigate({ to: "/items/$itemId", params: { itemId: String(item.id) } })
        }
      />
    </div>
  );
}
