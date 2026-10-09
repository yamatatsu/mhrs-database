import { createFileRoute } from "@tanstack/react-router";
import { WeaponsPage } from "@/pages/weapons";
import { loadDataset, loadManifest } from "@/shared/api";

export const Route = createFileRoute("/weapons")({
  loader: async () => {
    const [weapon, common, manifest] = await Promise.all([
      loadDataset("weapons/great_sword"),
      loadDataset("weapons/common"),
      loadManifest(),
    ]);
    return { weapon, common, manifest };
  },
  component: WeaponsRoute,
});

function WeaponsRoute() {
  const { weapon, common, manifest } = Route.useLoaderData();
  return <WeaponsPage weapon={weapon} common={common} manifest={manifest} />;
}
