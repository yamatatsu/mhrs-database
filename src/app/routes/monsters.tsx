import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/monsters")({
  component: MonstersLayout,
});

function MonstersLayout() {
  return <Outlet />;
}
