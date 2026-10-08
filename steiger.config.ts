import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // TanStack Router's file-based routing generates this file.
    ignores: ["**/routeTree.gen.ts"],
  },
]);
