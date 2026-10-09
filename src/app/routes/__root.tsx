import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { navigation } from "@/app/config/navigation";
import { siteTitle } from "@/app/config/site";
import { AppSidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <SidebarProvider>
        <AppSidebar title={siteTitle} items={navigation} />
        <SidebarInset>
          <div className="flex p-2">
            <SidebarTrigger />
          </div>
          <div className="flex-1 p-6 pt-0">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </>
  );
}
