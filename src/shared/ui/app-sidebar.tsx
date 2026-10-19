import { useEffect, type ReactNode } from "react";
import { Link, type LinkProps, useRouterState } from "@tanstack/react-router";
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
  useSidebar,
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
  const { setOpenMobile } = useSidebar();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // ブラウザの戻る/進むやプログラム遷移でも、モバイルのドロワーを閉じる。
  // リンクのクリック時は `SidebarLinkItem` が即座に閉じる。
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col gap-2 p-2 pr-14 md:pr-2">
        <SidebarMenuButton asChild size="lg">
          <Link to="/" onClick={() => setOpenMobile(false)}>
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
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className="h-11 md:h-8">
        <Link
          {...linkProps}
          activeProps={{ "data-active": true, "aria-current": "page" }}
          onClick={() => setOpenMobile(false)}
        >
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
