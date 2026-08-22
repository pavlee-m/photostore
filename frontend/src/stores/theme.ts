import { create } from "zustand";
import { applyTheme, THEME_STORAGE_KEY, type Theme } from "#/lib/theme.ts";

type ThemeState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
	theme: typeof window === "undefined" ? "light" : readClientTheme(),
	setTheme: (theme) => {
		applyTheme(theme);
		set({ theme });
	},
	toggleTheme: () => {
		const theme = get().theme === "dark" ? "light" : "dark";
		applyTheme(theme);
		set({ theme });
	},
}));

function readClientTheme(): Theme {
	return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
		? "dark"
		: "light";
}
