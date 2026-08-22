export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "photostore-theme";

export function applyTheme(theme: Theme) {
	if (typeof document === "undefined") {
		return;
	}
	document.documentElement.classList.toggle("dark", theme === "dark");
	window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
