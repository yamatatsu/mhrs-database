import { ThemeProvider } from "@/shared/lib";
import { AppRouterProvider } from "./routing";

export function App() {
  return (
    <ThemeProvider>
      <AppRouterProvider />
    </ThemeProvider>
  );
}
