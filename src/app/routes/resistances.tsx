import { createFileRoute } from "@tanstack/react-router";
import { loadResistances, ResistancesPage } from "@/pages/resistances";

export const Route = createFileRoute("/resistances")({
  loader: () => loadResistances().then((items) => ({ items })),
  component: ResistancesRoute,
});

function ResistancesRoute() {
  const { items } = Route.useLoaderData();
  return <ResistancesPage items={items} />;
}
