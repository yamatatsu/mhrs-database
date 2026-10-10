import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { MonsterIndexItem } from "@/shared/lib";
import { Input } from "@/shared/ui";

interface MonstersPageProps {
  list: readonly MonsterIndexItem[];
}

/**
 * モンスター一覧ページ。詳細ページへのリンクを並べるだけの軽量な一覧で、
 * 名前・異名・種族・危険度を添えて詳細へ誘導する。
 * 上部の検索欄でモンスター名の部分一致インクリメンタル検索ができる。
 */
export function MonstersPage({ list }: MonstersPageProps) {
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      keyword === ""
        ? list
        : list.filter((monster) => monster.name.toLowerCase().includes(keyword)),
    [list, keyword],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-bold">モンスター</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} 件</span>
      </div>
      <div className="flex">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="モンスター名で検索"
          aria-label="モンスター名で検索"
          className="max-w-md"
        />
      </div>
      {filtered.length > 0 ? (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((monster) => (
            <li key={monster.id}>
              <Link
                to="/monsters/$monsterId"
                params={{ monsterId: String(monster.id) }}
                className="flex flex-col gap-0.5 rounded-md border p-3 transition-colors hover:bg-accent"
              >
                <span className="font-medium">{monster.name}</span>
                {monster.alias ? (
                  <span className="text-xs text-muted-foreground">{monster.alias}</span>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {[monster.family, monster.rank !== null ? `危険度 ${monster.rank}` : null]
                    .filter(Boolean)
                    .join(" ・ ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          該当するモンスターがありません。
        </p>
      )}
    </div>
  );
}
