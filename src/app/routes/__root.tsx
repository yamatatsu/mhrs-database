import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { getSectionTitle, navigation } from "@/app/config/navigation";
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const title = getSectionTitle(pathname) ?? siteTitle;

  return (
    <SidebarProvider>
      <AppSidebar
        title={siteTitle}
        items={navigation}
        footer={
          <div className="flex items-center gap-1">
            <ThemeToggle className="h-11 flex-1 md:h-7" />
            <GitHubLink href={siteRepoUrl} className="size-11 md:size-7" />
          </div>
        }
      />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/90 px-2 py-1 backdrop-blur">
          <SidebarTrigger className="size-11 md:size-7" />
          <span className="min-w-0 truncate text-sm font-medium">{title}</span>
        </header>
        <div className="flex-1 p-4 sm:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
