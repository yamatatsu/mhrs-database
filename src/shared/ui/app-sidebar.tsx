import { Link, type LinkProps } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./sidebar";

export interface SidebarItem {
  readonly label: string;
  readonly to: NonNullable<LinkProps["to"]>;
}

export function AppSidebar({ title, items }: { title: string; items: readonly SidebarItem[] }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenuButton asChild size="lg">
          <Link to="/">
            <span className="text-base font-bold">{title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <Link to={item.to} activeProps={{ "data-active": true }}>
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
