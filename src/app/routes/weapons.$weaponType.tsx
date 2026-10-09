import { createFileRoute, notFound } from "@tanstack/react-router";
import { loadWeaponList, WeaponTypePage } from "@/pages/weapons";
import { getWeaponType } from "@/shared/lib";

export const Route = createFileRoute("/weapons/$weaponType")({
  loader: async ({ params }) => {
    const weaponType = getWeaponType(params.weaponType);
    if (!weaponType) throw notFound();
    const list = await loadWeaponList(weaponType);
    return { weaponType, list };
  },
  component: WeaponTypeRoute,
});

function WeaponTypeRoute() {
  const { weaponType, list } = Route.useLoaderData();
  return <WeaponTypePage weaponType={weaponType} list={list} />;
}
