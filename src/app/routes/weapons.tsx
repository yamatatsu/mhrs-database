import { createFileRoute } from "@tanstack/react-router";
import { WeaponsPage } from "@/pages/weapons";

export const Route = createFileRoute("/weapons")({
  component: WeaponsPage,
});
