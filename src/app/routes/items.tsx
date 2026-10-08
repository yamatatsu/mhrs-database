import { createFileRoute } from "@tanstack/react-router";
import { ItemsPage } from "@/pages/items";

export const Route = createFileRoute("/items")({
  component: ItemsPage,
});
