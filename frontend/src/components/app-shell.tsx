import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AlbumCreateDialogContext } from "#/components/album-create-dialog-context.ts";
import { AlbumFormDialog } from "#/components/album-form-dialog.tsx";
import { AppSidebar } from "#/components/app-sidebar.tsx";
import { ThemeToggle } from "#/components/theme-toggle.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar.tsx";
import { TooltipProvider } from "#/components/ui/tooltip.tsx";
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
	const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const onAlbumRoute = pathname.startsWith("/albums");
	const title =
		titles[pathname] ?? (onAlbumRoute ? "Album photos" : "Photostore");

	return (
		<AlbumCreateDialogContext.Provider value={() => setCreateAlbumOpen(true)}>
			<TooltipProvider>
				<SidebarProvider>
					<a
						className="fixed top-2 left-2 z-50 -translate-y-16 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:translate-y-0"
						href="#main-content"
					>
						Skip to content
					</a>
					<AppSidebar user={user} />
					<SidebarInset>
						<header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-lg">
							<div className="flex h-14 w-full items-center gap-3 px-4 sm:px-6">
								<SidebarTrigger
									aria-label="Toggle navigation"
									className="-ml-1"
								/>
								<div className="h-4 w-px bg-border" />
								<h1 className="truncate text-sm font-semibold sm:text-base">
									{title}
								</h1>
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
						<div id="main-content">
							<Outlet />
						</div>
						<AlbumFormDialog
							onOpenChange={setCreateAlbumOpen}
							onSaved={async () => {
								await queryClient.invalidateQueries({ queryKey: ["albums"] });
							}}
							open={createAlbumOpen}
						/>
					</SidebarInset>
				</SidebarProvider>
			</TooltipProvider>
		</AlbumCreateDialogContext.Provider>
	);
}
