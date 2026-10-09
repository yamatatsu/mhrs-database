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
  { label: "アイテム", to: "/items" },
];
