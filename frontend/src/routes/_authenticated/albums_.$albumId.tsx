import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderX, Images } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	listAlbumMedia,
	listAlbums,
	removeMediaFromAlbum,
} from "#/api/album.ts";
import { AddToAlbumDialog } from "#/components/add-to-album-dialog.tsx";
import { DeleteMediaDialog } from "#/components/delete-media-dialog.tsx";
import { EmptyState } from "#/components/empty-state.tsx";
import { MediaGridSkeleton } from "#/components/library-skeletons.tsx";
import { LoadErrorState } from "#/components/load-error-state.tsx";
import { MediaThumb } from "#/components/media-thumb.tsx";
import { MediaViewer } from "#/components/media-viewer.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import type { MediaFile } from "#/types/media.ts";

const BATCH_SIZE = 24;

export const Route = createFileRoute("/_authenticated/albums_/$albumId")({
	component: AlbumPhotosPage,
});

function AlbumPhotosPage() {
	const queryClient = useQueryClient();
	const { albumId: albumIdParam } = Route.useParams();
	const albumId = Number(albumIdParam);
	const [selected, setSelected] = useState<MediaFile | null>(null);
	const [deleting, setDeleting] = useState<MediaFile | null>(null);
	const [albumTarget, setAlbumTarget] = useState<MediaFile | null>(null);
	const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
	const [removingIds, setRemovingIds] = useState<Set<number>>(() => new Set());
	const sentinelRef = useRef<HTMLDivElement>(null);
	const albumsQuery = useQuery({
		queryKey: ["albums"],
		queryFn: listAlbums,
	});
	const mediaQueryKey = ["album-media", albumId] as const;
	const mediaQuery = useQuery({
		queryKey: mediaQueryKey,
		queryFn: () => listAlbumMedia(albumId),
		enabled: Number.isSafeInteger(albumId) && albumId > 0,
	});
	const album = albumsQuery.data?.find((item) => item.id === albumId);
	const media = mediaQuery.data ?? [];
	const visibleMedia = useMemo(
		() => media.slice(0, visibleCount),
		[media, visibleCount],
	);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || visibleCount >= media.length) {
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			if (entries[0]?.isIntersecting) {
				setVisibleCount((current) =>
					Math.min(current + BATCH_SIZE, media.length),
				);
			}
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [media.length, visibleCount]);

	async function handleRemove(item: MediaFile) {
		if (removingIds.has(item.id)) {
			return;
		}
		setRemovingIds((current) => new Set(current).add(item.id));
		try {
			await removeMediaFromAlbum(albumId, item.id);
			queryClient.setQueryData<MediaFile[]>(mediaQueryKey, (current) =>
				current?.filter((mediaItem) => mediaItem.id !== item.id),
			);
			toast.success("Photo removed from album.");
		} catch (error) {
			toastApiError(error, "Could not remove this photo from the album.");
		} finally {
			setRemovingIds((current) => {
				const next = new Set(current);
				next.delete(item.id);
				return next;
			});
		}
	}

	if (albumsQuery.isLoading || mediaQuery.isLoading) {
		return (
			<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-7 grid gap-3">
					<Skeleton className="h-5 w-20" />
					<Skeleton className="h-9 w-64 max-w-full" />
					<Skeleton className="h-5 w-96 max-w-full" />
				</div>
				<MediaGridSkeleton />
			</main>
		);
	}

	if (albumsQuery.isError || mediaQuery.isError) {
		return <LoadErrorState message="Could not load this album." />;
	}

	if (!Number.isSafeInteger(albumId) || albumId <= 0 || !album) {
		return (
			<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
				<EmptyState
					action={
						<Button asChild variant="outline">
							<Link to="/albums">Back to albums</Link>
						</Button>
					}
					className="min-h-[55svh] border"
					description="This album may have been deleted or is no longer available."
					icon={FolderX}
					title="Album not found"
				/>
			</main>
		);
	}

	return (
		<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
			<Breadcrumb className="mb-4">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link to="/albums">Albums</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{album.name}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<PageHeader
				description={album.description || undefined}
				title={album.name}
			/>
			{media.length === 0 ? (
				<EmptyState
					className="min-h-[45svh] border"
					description="Add photos from your library using the action menu on any photo."
					icon={Images}
					title="This album is empty"
				/>
			) : (
				<>
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
						{visibleMedia.map((item) => (
							<MediaThumb
								key={item.id}
								media={item}
								onOpen={setSelected}
								onRemoveFromAlbum={(mediaItem) => void handleRemove(mediaItem)}
							/>
						))}
					</div>
					<div className="h-12" ref={sentinelRef} />
					{visibleMedia.length < media.length ? (
						<p className="pb-8 text-center text-sm text-muted-foreground">
							Scroll to load more
						</p>
					) : null}
				</>
			)}
			{selected ? (
				<MediaViewer
					media={selected}
					onAddToAlbum={setAlbumTarget}
					onClose={() => setSelected(null)}
					onDelete={setDeleting}
				/>
			) : null}
			<AddToAlbumDialog
				media={albumTarget}
				onOpenChange={(open) => {
					if (!open) {
						setAlbumTarget(null);
					}
				}}
				open={albumTarget !== null}
			/>
			<DeleteMediaDialog
				media={deleting}
				onDeleted={() => setSelected(null)}
				onOpenChange={(open) => {
					if (!open) {
						setDeleting(null);
					}
				}}
			/>
		</main>
	);
}
