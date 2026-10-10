import { createFileRoute } from "@tanstack/react-router";
import { loadMonsterList, MonstersPage } from "@/pages/monsters";

export const Route = createFileRoute("/monsters/")({
  loader: () => loadMonsterList().then((list) => ({ list })),
  component: MonstersIndexRoute,
});

function MonstersIndexRoute() {
  const { list } = Route.useLoaderData();
  return <MonstersPage list={list} />;
}
