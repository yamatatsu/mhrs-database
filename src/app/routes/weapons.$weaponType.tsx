import { createFileRoute, notFound } from "@tanstack/react-router";
import { WeaponTypePage } from "@/pages/weapons";
import { loadDataset } from "@/shared/api";
import { getWeaponType, type WeaponIndexItem } from "@/shared/lib";

export const Route = createFileRoute("/weapons/$weaponType")({
  loader: async ({ params }) => {
    const weaponType = getWeaponType(params.weaponType);
    if (!weaponType) throw notFound();
    const items = await loadDataset<WeaponIndexItem[]>(`weapons/${weaponType.id}/index`);
    return { weaponType, items };
  },
  component: WeaponTypeRoute,
});

function WeaponTypeRoute() {
  const { weaponType, items } = Route.useLoaderData();
  return <WeaponTypePage weaponType={weaponType} items={items} />;
}
