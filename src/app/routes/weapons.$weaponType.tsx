import {
  createFileRoute,
  notFound,
  Outlet,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { loadWeaponList, WeaponTypePage } from "@/pages/weapons";
import { getWeaponType, type WeaponIndexItem } from "@/shared/lib";

export const Route = createFileRoute("/weapons/$weaponType")({
  loader: async ({ params }) => {
    const weaponType = getWeaponType(params.weaponType);
    if (!weaponType) throw notFound();
    const list = await loadWeaponList(weaponType);
    return { weaponType, list };
  },
  component: WeaponTypeRoute,
});

/**
 * 武器種の一覧。詳細は子ルート（`/weapons/$weaponType/$weaponId`）のドロワーとして
 * `<Outlet />` に描画する。親は一覧を保持したまま子だけが入れ替わるため、
 * ドロワーの開閉で一覧のソート状態が失われない。
 */
function WeaponTypeRoute() {
  const { weaponType, list } = Route.useLoaderData();
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const detailMatch = matchRoute({ to: "/weapons/$weaponType/$weaponId", fuzzy: false });

  return (
    <>
      <WeaponTypePage
        weaponType={weaponType}
        list={list}
        selectedWeaponId={detailMatch ? Number(detailMatch.weaponId) : undefined}
        onSelectWeapon={(weapon: WeaponIndexItem) => {
          void navigate({
            to: "/weapons/$weaponType/$weaponId",
            params: { weaponType: weaponType.id, weaponId: String(weapon.id) },
            resetScroll: false,
          });
        }}
      />
      <Outlet />
    </>
  );
}
