import { createFileRoute, notFound } from "@tanstack/react-router";
import { ItemDetailPage, loadItemDetail } from "@/pages/items";

export const Route = createFileRoute("/items/$itemId")({
  loader: async ({ params }) => {
    const id = Number(params.itemId);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    // 存在しない id は 404（データセットの取得失敗）になるため notFound に変換する。
    const detail = await loadItemDetail(id).catch(() => {
      throw notFound();
    });
    return { detail };
  },
  component: ItemDetailRoute,
});

function ItemDetailRoute() {
  const { detail } = Route.useLoaderData();
  return <ItemDetailPage detail={detail} />;
}
