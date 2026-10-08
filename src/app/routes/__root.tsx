import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { navigation } from "@/app/config/navigation";
import { siteTitle } from "@/app/config/site";
import { Header, Sidebar } from "@/shared/ui";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header title={siteTitle} />
      <div className="flex flex-1">
        <Sidebar items={navigation} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </div>
  );
}
