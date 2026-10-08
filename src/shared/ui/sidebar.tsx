import { Link, type LinkProps } from "@tanstack/react-router";

export interface SidebarItem {
  readonly label: string;
  readonly to: NonNullable<LinkProps["to"]>;
}

export function Sidebar({ items }: { items: readonly SidebarItem[] }) {
  return (
    <aside className="w-56 shrink-0 border-r">
      <nav className="flex flex-col gap-1 p-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            activeProps={{
              className: "bg-accent font-medium text-accent-foreground",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
