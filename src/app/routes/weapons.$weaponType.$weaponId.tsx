import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  loadHyakuryuSkillNames,
  loadItemNames,
  loadWeaponDetail,
  loadWeaponList,
  WeaponDetailDrawer,
} from "@/pages/weapons";
import { getWeaponType } from "@/shared/lib";

export const Route = createFileRoute("/weapons/$weaponType/$weaponId")({
  loader: async ({ params }) => {
    const weaponType = getWeaponType(params.weaponType);
    if (!weaponType) throw notFound();
    const id = Number(params.weaponId);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    // 一覧は親ルートで読込済み（`loadDataset` のキャッシュで即時返る）。
    // 派生ツリーの名称解決のため子でも受け取る。
    const [detail, list, itemNames, hyakuryuSkillNames] = await Promise.all([
      loadWeaponDetail(weaponType, id).catch(() => {
        throw notFound();
      }),
      loadWeaponList(weaponType),
      loadItemNames(),
      loadHyakuryuSkillNames(),
    ]);
    return { weaponType, detail, list, itemNames, hyakuryuSkillNames };
  },
  component: WeaponDetailRoute,
});

function WeaponDetailRoute() {
  const { weaponType, detail, list, itemNames, hyakuryuSkillNames } = Route.useLoaderData();
  return (
    <WeaponDetailDrawer
      weaponType={weaponType}
      detail={detail}
      list={list.items}
      itemNames={itemNames}
      hyakuryuSkillNames={hyakuryuSkillNames}
    />
  );
}
