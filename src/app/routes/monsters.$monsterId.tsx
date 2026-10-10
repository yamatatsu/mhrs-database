import { createFileRoute, notFound } from "@tanstack/react-router";
import { loadMonsterDetail, MonsterDetailPage } from "@/pages/monsters";

export const Route = createFileRoute("/monsters/$monsterId")({
  loader: async ({ params }) => {
    const id = Number(params.monsterId);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    // 存在しない id は 404（データセットの取得失敗）になるため notFound に変換する。
    const detail = await loadMonsterDetail(id).catch(() => {
      throw notFound();
    });
    return { detail };
  },
  component: MonsterDetailRoute,
});

function MonsterDetailRoute() {
  const { detail } = Route.useLoaderData();
  return <MonsterDetailPage detail={detail} />;
}
