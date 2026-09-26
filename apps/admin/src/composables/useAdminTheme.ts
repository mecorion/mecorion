type Theme = "light" | "dark";
const THEME_KEY = "mecorion.theme";

export function useAdminTheme() {
  const theme = useState<Theme>("admin-theme", () => "dark");

  function apply(nextTheme: Theme) {
    theme.value = nextTheme;
    if (!import.meta.client) return;
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.classList.toggle("light", nextTheme === "light");
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem(THEME_KEY, nextTheme);
  }

  function initialize() {
    if (!import.meta.client) return;
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    const preferred: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    apply(saved === "light" || saved === "dark" ? saved : preferred);
  }

  function toggle() {
    apply(theme.value === "dark" ? "light" : "dark");
  }

  return {theme: readonly(theme), initialize, toggle};
}
