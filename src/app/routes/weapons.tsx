import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/weapons")({
  component: WeaponsLayout,
});

function WeaponsLayout() {
  return <Outlet />;
}
