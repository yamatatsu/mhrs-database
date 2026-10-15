import { createFileRoute } from "@tanstack/react-router";
import { loadItemList, ItemsPage } from "@/pages/items";

export const Route = createFileRoute("/items/")({
  loader: () => loadItemList().then((list) => ({ list })),
  component: ItemsIndexRoute,
});

function ItemsIndexRoute() {
  const { list } = Route.useLoaderData();
  return <ItemsPage list={list} />;
}
