import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { Menu, Plus } from "lucide-react";
import { useState } from "react";
import { AlbumCreateDialogContext } from "#/components/album-create-dialog-context.ts";
import { AlbumFormDialog } from "#/components/album-form-dialog.tsx";
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
	const queryClient = useQueryClient();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const onAlbumRoute = pathname.startsWith("/albums");
	const title =
		titles[pathname] ?? (onAlbumRoute ? "Album photos" : "Photostore");

	return (
		<AlbumCreateDialogContext.Provider value={() => setCreateAlbumOpen(true)}>
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
							{pathname === "/albums" ? (
								<Button
									aria-label="Create album"
									onClick={() => setCreateAlbumOpen(true)}
									size="sm"
								>
									<Plus className="size-4" />
									<span className="hidden sm:inline">Create album</span>
								</Button>
							) : null}
							{onAlbumRoute ? null : <UploadButton />}
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
				<AlbumFormDialog
					onOpenChange={setCreateAlbumOpen}
					onSaved={async () => {
						await queryClient.invalidateQueries({ queryKey: ["albums"] });
					}}
					open={createAlbumOpen}
				/>
			</div>
		</AlbumCreateDialogContext.Provider>
	);
}
