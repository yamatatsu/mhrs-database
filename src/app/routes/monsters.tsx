import { createFileRoute } from "@tanstack/react-router";
import { MonstersPage } from "@/pages/monsters";

export const Route = createFileRoute("/monsters")({
  component: MonstersPage,
});
