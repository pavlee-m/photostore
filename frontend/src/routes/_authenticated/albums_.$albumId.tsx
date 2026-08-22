import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Images } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	listAlbumMedia,
	listAlbums,
	removeMediaFromAlbum,
} from "#/api/album.ts";
import { AddToAlbumDialog } from "#/components/add-to-album-dialog.tsx";
import { DeleteMediaDialog } from "#/components/delete-media-dialog.tsx";
import { MediaGridSkeleton } from "#/components/library-skeletons.tsx";
import { LoadErrorState } from "#/components/load-error-state.tsx";
import { MediaThumb } from "#/components/media-thumb.tsx";
import { MediaViewer } from "#/components/media-viewer.tsx";
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
			<main className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-6">
				<section className="text-center">
					<h2 className="display-title text-3xl">Album not found</h2>
					<p className="mt-2 text-(--sea-ink-soft)">
						This album may have been deleted.
					</p>
					<Link
						className="mt-5 inline-flex items-center gap-2 font-medium"
						to="/albums"
					>
						<ArrowLeft className="size-4" />
						Back to albums
					</Link>
				</section>
			</main>
		);
	}

	return (
		<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
			<header className="mb-7">
				<Link
					className="inline-flex items-center gap-2 text-sm font-medium no-underline"
					to="/albums"
				>
					<ArrowLeft className="size-4" />
					Albums
				</Link>
				<h2 className="display-title mt-4 text-3xl">{album.name}</h2>
				{album.description ? (
					<p className="mt-2 max-w-2xl text-(--sea-ink-soft)">
						{album.description}
					</p>
				) : null}
			</header>
			{media.length === 0 ? (
				<section className="flex min-h-[45svh] items-center justify-center">
					<div className="max-w-md text-center">
						<span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-(--chip-bg) text-(--lagoon-deep)">
							<Images className="size-7" />
						</span>
						<h3 className="display-title mt-5 text-3xl">
							This album appears to be empty
						</h3>
						<p className="mt-2 text-(--sea-ink-soft)">
							Add photos from your library using their right-click menu.
						</p>
					</div>
				</section>
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
						<p className="pb-8 text-center text-sm text-(--sea-ink-soft)">
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
