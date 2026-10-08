import { Link } from "@tanstack/react-router";
import { navigation } from "./navigation";

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r">
      <nav className="flex flex-col gap-1 p-2">
        {navigation.map((item) => (
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
