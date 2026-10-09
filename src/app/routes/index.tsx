import { createFileRoute, redirect } from "@tanstack/react-router";
import { weaponTypes } from "@/shared/lib";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/weapons/$weaponType", params: { weaponType: weaponTypes[0].id } });
  },
});
