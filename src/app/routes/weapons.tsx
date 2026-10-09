import { createFileRoute } from "@tanstack/react-router";
import { WeaponsPage } from "@/pages/weapons";
import { loadDataset, loadManifest } from "@/shared/api";

export const Route = createFileRoute("/weapons")({
  loader: async () => {
    const [data, manifest] = await Promise.all([loadDataset("weapons"), loadManifest()]);
    return { data, manifest };
  },
  component: WeaponsRoute,
});

function WeaponsRoute() {
  const { data, manifest } = Route.useLoaderData();
  return <WeaponsPage data={data} manifest={manifest} />;
}
