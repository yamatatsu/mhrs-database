import { createRootRoute, Outlet } from "@tanstack/react-router";
import { navigation } from "@/app/config/navigation";
import { siteRepoUrl, siteTitle } from "@/app/config/site";
import {
  AppSidebar,
  GitHubLink,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  ThemeToggle,
} from "@/shared/ui";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <SidebarProvider>
      <AppSidebar
        title={siteTitle}
        items={navigation}
        footer={
          <div className="flex items-center gap-1">
            <ThemeToggle className="flex-1" />
            <GitHubLink href={siteRepoUrl} />
          </div>
        }
      />
      <SidebarInset>
        <div className="flex p-2">
          <SidebarTrigger />
        </div>
        <div className="flex-1 p-6 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
