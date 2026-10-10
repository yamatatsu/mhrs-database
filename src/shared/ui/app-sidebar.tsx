import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./sidebar";

/** リンク可能なナビ項目。TanStack Router の Link にそのまま渡せる。 */
export type SidebarLink = LinkProps & { readonly label: string };

/** リンクではないカテゴリ。子リンクをまとめる見出し。 */
export interface SidebarCategory {
  readonly label: string;
  readonly items: readonly SidebarLink[];
}

export type SidebarEntry = SidebarLink | SidebarCategory;

function isCategory(entry: SidebarEntry): entry is SidebarCategory {
  return "items" in entry;
}

export function AppSidebar({
  title,
  items,
  footer,
}: {
  title: string;
  items: readonly SidebarEntry[];
  footer?: ReactNode;
}) {
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
        {items.map((entry) =>
          isCategory(entry) ? (
            <SidebarGroup key={entry.label}>
              <SidebarGroupLabel>{entry.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {entry.items.map((link) => (
                    <SidebarLinkItem key={link.label} link={link} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            <SidebarGroup key={entry.label}>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarLinkItem link={entry} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ),
        )}
      </SidebarContent>
      {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
    </Sidebar>
  );
}

function SidebarLinkItem({ link }: { link: SidebarLink }) {
  const { label, ...linkProps } = link;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link {...linkProps} activeProps={{ "data-active": true }}>
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
