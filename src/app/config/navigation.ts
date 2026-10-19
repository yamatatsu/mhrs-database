import { weaponTypes } from "@/shared/lib";
import type { SidebarEntry, SidebarLink } from "@/shared/ui";

export const navigation: readonly SidebarEntry[] = [
  {
    label: "武器",
    items: weaponTypes.map((weaponType): SidebarLink => ({
      label: weaponType.label,
      to: "/weapons/$weaponType",
      params: { weaponType: weaponType.id },
    })),
  },
  { label: "モンスター", to: "/monsters" },
  { label: "状態異常耐性", to: "/resistances" },
  { label: "アイテム", to: "/items" },
];

/** アプリヘッダーに表示する現在地。パスの先頭セグメントと対応させる。 */
const sectionTitles: readonly { readonly prefix: string; readonly title: string }[] = [
  { prefix: "/weapons", title: "武器" },
  { prefix: "/monsters", title: "モンスター" },
  { prefix: "/resistances", title: "状態異常耐性" },
  { prefix: "/items", title: "アイテム" },
];

/** パス名から現在地のラベルを返す。該当がなければ `undefined`。 */
export function getSectionTitle(pathname: string): string | undefined {
  return sectionTitles.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )?.title;
}
