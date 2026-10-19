import { Link } from "@tanstack/react-router";
import type { MonsterDetail } from "@/shared/lib";
import { MonsterHitzoneTable } from "./MonsterHitzoneTable";
import { MonsterPartBreakTable } from "./MonsterPartBreakTable";
import { MonsterStatusTable } from "./MonsterStatusTable";

interface MonsterDetailPageProps {
  detail: MonsterDetail;
}

/** モンスター詳細ページ。基本情報・部位破壊・肉質・状態異常耐性・図鑑説明を表示する。 */
export function MonsterDetailPage({ detail }: MonsterDetailPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link to="/monsters" className="text-sm text-muted-foreground hover:underline">
          ← モンスター一覧
        </Link>
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-2xl font-bold">{detail.name ?? "不明なモンスター"}</h1>
          {detail.alias ? (
            <span className="text-sm text-muted-foreground">{detail.alias}</span>
          ) : null}
        </div>
      </div>

      <Section title="基本情報">
        <BasicInfo detail={detail} />
      </Section>

      {detail.parts_break && detail.parts_break.length > 0 ? (
        <Section title="部位破壊">
          <MonsterPartBreakTable detail={detail} />
        </Section>
      ) : null}

      <Section title="肉質">
        <MonsterHitzoneTable detail={detail} />
      </Section>

      <Section title="状態異常耐性">
        <MonsterStatusTable detail={detail} />
      </Section>

      {detail.description.length > 0 ? (
        <Section title="図鑑説明">
          <div className="flex flex-col gap-3">
            {detail.description.map((paragraph, index) => (
              <p key={index} className="text-sm leading-relaxed whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </Section>
      ) : null}
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

function BasicInfo({ detail }: { detail: MonsterDetail }) {
  const size = detail.size;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
      <Stat label="種族" value={detail.family ?? "—"} />
      <Stat label="危険度" value={detail.rank ?? "—"} />
      <Stat label="体力 (LR/HR)" value={detail.data_tune?.base_hp_vital ?? "—"} />
      <Stat label="体力 (MR)" value={detail.data_tune?.master_hp_vital ?? "—"} />
      <Stat label="基準サイズ" value={size ? size.base_size.toFixed(2) : "—"} />
      <Stat
        label="最小サイズ"
        value={size ? (size.base_size * size.small_boarder).toFixed(2) : "—"}
      />
      <Stat
        label="最大サイズ"
        value={size ? (size.base_size * size.big_boarder).toFixed(2) : "—"}
      />
      <Stat
        label="金冠サイズ"
        value={size ? (size.base_size * size.king_boarder).toFixed(2) : "—"}
      />
    </dl>
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
