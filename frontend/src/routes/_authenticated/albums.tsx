import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteAlbum, listAlbums } from "#/api/album.ts";
import { AlbumCover } from "#/components/album-cover.tsx";
import { useAlbumCreateDialog } from "#/components/album-create-dialog-context.ts";
import { AlbumFormDialog } from "#/components/album-form-dialog.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "#/components/ui/context-menu.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { forgetAlbumCoverUrl } from "#/hooks/use-album-cover-url.ts";
import { toastApiError } from "#/lib/api-error.ts";
import type { Album } from "#/types/album.ts";

export const Route = createFileRoute("/_authenticated/albums")({
	component: AlbumsPage,
});

function AlbumsPage() {
	const queryClient = useQueryClient();
	const openCreateDialog = useAlbumCreateDialog();
	const [editing, setEditing] = useState<Album | null>(null);
	const [deleting, setDeleting] = useState<Album | null>(null);
	const [deleteBusy, setDeleteBusy] = useState(false);
	const albumsQuery = useQuery({
		queryKey: ["albums"],
		queryFn: listAlbums,
	});

	async function refreshAlbums() {
		await queryClient.invalidateQueries({ queryKey: ["albums"] });
	}

	async function handleDelete() {
		if (!deleting) {
			return;
		}
		setDeleteBusy(true);
		try {
			await deleteAlbum(deleting.id);
			forgetAlbumCoverUrl(deleting.id);
			setDeleting(null);
			await refreshAlbums();
			toast.success("Album deleted.");
		} catch (error) {
			toastApiError(error, "Could not delete the album.");
		} finally {
			setDeleteBusy(false);
		}
	}

	if (albumsQuery.isLoading) {
		return (
			<main className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-6">
				<p className="text-[var(--sea-ink-soft)]">Loading your albums...</p>
			</main>
		);
	}

	if (albumsQuery.isError) {
		return (
			<main className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-6">
				<p className="text-destructive">Could not load your albums.</p>
			</main>
		);
	}

	if (!albumsQuery.data?.length) {
		return (
			<main className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-6">
				<section className="max-w-md text-center">
					<span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--chip-bg)] text-[var(--lagoon-deep)]">
						<FolderOpen className="size-7" />
					</span>
					<p className="island-kicker mt-5">Your collections</p>
					<h2 className="display-title mt-3 text-4xl">No albums yet</h2>
					<p className="mt-3 text-[var(--sea-ink-soft)]">
						Create an album to keep favorite moments together and easy to find.
					</p>
					<Button className="mt-6" onClick={openCreateDialog}>
						<Plus className="size-4" />
						Create your first album
					</Button>
				</section>
			</main>
		);
	}

	return (
		<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
				{albumsQuery.data.map((album) => (
					<ContextMenu key={album.id}>
						<ContextMenuTrigger asChild>
							<Link
								className="island-shell group overflow-hidden rounded-2xl no-underline transition-transform hover:-translate-y-0.5"
								params={{ albumId: String(album.id) }}
								to="/albums/$albumId"
							>
								<div className="aspect-[4/3] overflow-hidden">
									<AlbumCover
										album={album}
										className="transition-transform duration-300 group-hover:scale-[1.03]"
									/>
								</div>
								<div className="p-4">
									<h2 className="truncate text-base font-semibold text-[var(--sea-ink)]">
										{album.name}
									</h2>
									<p className="mt-1 line-clamp-2 min-h-10 text-sm text-[var(--sea-ink-soft)]">
										{album.description || "No description"}
									</p>
								</div>
							</Link>
						</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem
								onSelect={() => {
									window.setTimeout(() => setEditing(album), 0);
								}}
							>
								<Pencil />
								Edit
							</ContextMenuItem>
							<ContextMenuSeparator />
							<ContextMenuItem
								onSelect={() => {
									window.setTimeout(() => setDeleting(album), 0);
								}}
								variant="destructive"
							>
								<Trash2 />
								Delete
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				))}
			</div>
			<AlbumFormDialog
				album={editing}
				onOpenChange={(open) => {
					if (!open) {
						setEditing(null);
					}
				}}
				onSaved={refreshAlbums}
				open={editing !== null}
			/>
			<Dialog
				onOpenChange={(open) => {
					if (!open) {
						setDeleting(null);
					}
				}}
				open={deleting !== null}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete album</DialogTitle>
						<DialogDescription>
							Delete {deleting?.name}? The photos will stay in your library, but
							this album cannot be restored.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							onClick={() => setDeleting(null)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={deleteBusy}
							onClick={() => void handleDelete()}
							variant="destructive"
						>
							{deleteBusy ? "Deleting..." : "Delete album"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}
