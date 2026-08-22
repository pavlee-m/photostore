import { Outlet, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { AppSidebar } from "#/components/app-sidebar.tsx";
import { ThemeToggle } from "#/components/theme-toggle.tsx";
import { Button } from "#/components/ui/button.tsx";
import { UploadButton } from "#/components/upload-button.tsx";
import type { User } from "#/types/user.ts";

const titles: Record<string, string> = {
	"/": "My Photos",
	"/albums": "Albums",
	"/admin": "Admin Panel",
	"/profile": "Profile",
};

export function AppShell({ user }: { user: User }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const title = titles[pathname] ?? "Photostore";

	return (
		<div className="min-h-svh">
			<header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-md">
				<div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
					<Button
						aria-label="Open sidebar"
						onClick={() => setSidebarOpen(true)}
						size="icon"
						variant="ghost"
					>
						<Menu className="size-5" />
					</Button>
					<h1 className="display-title text-2xl">{title}</h1>
					<div className="ml-auto flex items-center gap-2">
						<UploadButton />
						<ThemeToggle />
					</div>
				</div>
			</header>
			<AppSidebar
				onClose={() => setSidebarOpen(false)}
				open={sidebarOpen}
				user={user}
			/>
			<Outlet />
		</div>
	);
}
