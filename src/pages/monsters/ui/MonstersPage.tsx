import { Link } from "@tanstack/react-router";
import type { MonsterIndexItem } from "@/shared/lib";

interface MonstersPageProps {
  list: readonly MonsterIndexItem[];
}

/**
 * モンスター一覧ページ。詳細ページへのリンクを並べるだけの軽量な一覧で、
 * 名前・異名・種族・危険度を添えて詳細へ誘導する。
 */
export function MonstersPage({ list }: MonstersPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-bold">モンスター</h1>
        <span className="text-sm text-muted-foreground">{list.length} 件</span>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((monster) => (
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
    </div>
  );
}
