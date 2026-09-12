import { QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useLayoutEffect } from "react";
import { loadAuthSnapshot } from "#/api/session.ts";
import { PageError, PagePending } from "#/components/page-status.tsx";
import { Toaster } from "#/components/ui/sonner.tsx";
import { UploadToastsHost } from "#/components/upload-toasts-host.tsx";
import { applyTheme } from "#/lib/theme.ts";
import { useAuthStore } from "#/stores/auth.ts";
import { useThemeStore } from "#/stores/theme.ts";
import type { RouterContext } from "#/types/router.ts";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Photostore",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
		scripts: [
			{
				children: `try{if(localStorage.getItem("photostore-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
			},
		],
	}),
	beforeLoad: async () => {
		const auth = await loadAuthSnapshot();
		if (!import.meta.env.SSR) {
			useAuthStore.getState().hydrate(auth);
		}
		return { auth };
	},
	pendingComponent: PagePending,
	errorComponent: PageError,
	shellComponent: RootDocument,
	component: RootComponent,
});

function RootComponent() {
	const { queryClient, auth } = Route.useRouteContext();
	const theme = useThemeStore((state) => state.theme);

	useLayoutEffect(() => {
		useAuthStore.getState().hydrate(auth);
	}, [auth]);

	useLayoutEffect(() => {
		applyTheme(theme);
	}, [theme]);

	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
			<Toaster closeButton visibleToasts={8} />
			<UploadToastsHost />
		</QueryClientProvider>
	);
}

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
