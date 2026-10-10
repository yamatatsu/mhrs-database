import type { ComponentType } from "react";
import { cn } from "cn";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { type Theme, useTheme } from "@/shared/lib";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

type ThemeOption = {
  readonly value: Theme;
  readonly label: string;
  readonly icon: ComponentType<{ readonly className?: string }>;
};

const themeOptions: readonly ThemeOption[] = [
  { value: "light", label: "ライト", icon: SunIcon },
  { value: "dark", label: "ダーク", icon: MoonIcon },
  { value: "system", label: "システム", icon: MonitorIcon },
];

export function ThemeToggle({ className }: { readonly className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("w-full justify-start", className)}>
          <SunIcon className="dark:hidden" />
          <MoonIcon className="hidden dark:block" />
          <span>テーマ</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            setTheme(value as Theme);
          }}
        >
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <Icon />
                <span>{option.label}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
