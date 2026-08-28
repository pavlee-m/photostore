import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteAlbum, listAlbums } from "#/api/album.ts";
import { AlbumCover } from "#/components/album-cover.tsx";
import { useAlbumCreateDialog } from "#/components/album-create-dialog-context.ts";
import { AlbumFormDialog } from "#/components/album-form-dialog.tsx";
import { ConfirmationDialog } from "#/components/confirmation-dialog.tsx";
import { EmptyState } from "#/components/empty-state.tsx";
import { AlbumGridSkeleton } from "#/components/library-skeletons.tsx";
import { LoadErrorState } from "#/components/load-error-state.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card } from "#/components/ui/card.tsx";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "#/components/ui/context-menu.tsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
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
			<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
				<PageHeader
					actions={<Skeleton className="h-9 w-28" />}
					description={<Skeleton className="h-5 w-72 max-w-full" />}
					title="Albums"
				/>
				<AlbumGridSkeleton />
			</main>
		);
	}

	if (albumsQuery.isError) {
		return <LoadErrorState message="Could not load your albums." />;
	}

	if (!albumsQuery.data?.length) {
		return (
			<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
				<PageHeader
					description="Group related photos and videos into collections."
					title="Albums"
				/>
				<EmptyState
					action={
						<Button onClick={openCreateDialog}>
							<Plus />
							Create your first album
						</Button>
					}
					className="min-h-[50svh] border"
					description="Create an album to keep favorite moments together and easy to find."
					icon={FolderOpen}
					title="No albums yet"
				/>
			</main>
		);
	}

	return (
		<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
			<PageHeader
				actions={
					<Button onClick={openCreateDialog}>
						<Plus />
						New album
					</Button>
				}
				description="Group related photos and videos into collections."
				title="Albums"
			/>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
				{albumsQuery.data.map((album) => (
					<ContextMenu key={album.id}>
						<ContextMenuTrigger asChild>
							<Card className="group relative gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md focus-within:ring-[3px] focus-within:ring-ring/50">
								<Link
									className="no-underline outline-none"
									params={{ albumId: String(album.id) }}
									to="/albums/$albumId"
								>
									<div className="aspect-4/3 overflow-hidden">
										<AlbumCover
											album={album}
											className="transition-transform duration-300 group-hover:scale-[1.03]"
										/>
									</div>
									<div className="p-4">
										<h2 className="truncate text-base font-semibold">
											{album.name}
										</h2>
										<p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
											{album.description || "No description"}
										</p>
									</div>
								</Link>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											aria-label={`Actions for ${album.name}`}
											className="absolute top-2 right-2 size-8 bg-background/90 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background group-focus-within:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
											size="icon"
											variant="outline"
										>
											<MoreHorizontal />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onSelect={() =>
												window.setTimeout(() => setEditing(album), 0)
											}
										>
											<Pencil />
											Edit
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onSelect={() =>
												window.setTimeout(() => setDeleting(album), 0)
											}
											variant="destructive"
										>
											<Trash2 />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</Card>
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
			<ConfirmationDialog
				busy={deleteBusy}
				busyLabel="Deleting..."
				confirmLabel="Delete album"
				description={
					<>
						Delete {deleting?.name}? The photos will stay in your library, but
						this album cannot be restored.
					</>
				}
				onConfirm={handleDelete}
				onOpenChange={(open) => {
					if (!open) {
						setDeleting(null);
					}
				}}
				open={deleting !== null}
				title="Delete album"
			/>
		</main>
	);
}
