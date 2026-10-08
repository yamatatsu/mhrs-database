import { Link } from "@tanstack/react-router";

export function Header({ title }: { title: string }) {
  return (
    <header className="border-b">
      <div className="flex h-14 items-center px-4">
        <Link to="/" className="text-lg font-bold">
          {title}
        </Link>
      </div>
    </header>
  );
}
