import { useInfiniteQuery } from "@tanstack/react-query";
import { Images } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { listMedia } from "#/api/media.ts";
import { AddToAlbumDialog } from "#/components/add-to-album-dialog.tsx";
import { DeleteMediaDialog } from "#/components/delete-media-dialog.tsx";
import { EmptyState } from "#/components/empty-state.tsx";
import { MediaGridSkeleton } from "#/components/library-skeletons.tsx";
import { LoadErrorState } from "#/components/load-error-state.tsx";
import { MediaThumb } from "#/components/media-thumb.tsx";
import { MediaViewer } from "#/components/media-viewer.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { groupMediaByDate } from "#/lib/dates.ts";
import type { MediaFile } from "#/types/media.ts";
import { useAuthStore } from "#/stores/auth.ts";

const PAGE_SIZE = 24;

export function PhotosLibrary() {
	const user = useAuthStore((state) => state.user);
	const [selected, setSelected] = useState<MediaFile | null>(null);
	const [deleting, setDeleting] = useState<MediaFile | null>(null);
	const [albumTarget, setAlbumTarget] = useState<MediaFile | null>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const mediaQuery = useInfiniteQuery({
		queryKey: ["media-list", user?.id],
		queryFn: ({ pageParam }) => listMedia(pageParam, PAGE_SIZE),
		initialPageParam: 0,
		getNextPageParam: (lastPage, pages) =>
			lastPage.length < PAGE_SIZE ? undefined : pages.length,
	});

	const items = useMemo(
		() => mediaQuery.data?.pages.flat() ?? [],
		[mediaQuery.data],
	);
	const groups = useMemo(() => groupMediaByDate(items), [items]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) {
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			if (
				entries[0]?.isIntersecting &&
				mediaQuery.hasNextPage &&
				!mediaQuery.isFetchingNextPage
			) {
				void mediaQuery.fetchNextPage();
			}
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [
		mediaQuery.fetchNextPage,
		mediaQuery.hasNextPage,
		mediaQuery.isFetchingNextPage,
	]);

	if (mediaQuery.isLoading) {
		return (
			<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-8 grid gap-2">
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-5 w-72 max-w-full" />
				</div>
				<MediaGridSkeleton />
			</main>
		);
	}

	if (mediaQuery.isError) {
		return <LoadErrorState message="Could not load your photos." />;
	}

	if (items.length === 0) {
		return (
			<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
				<PageHeader
					description="Browse and organize every photo and video you upload."
					title="Photos"
				/>
				<EmptyState
					className="min-h-[50svh] border"
					description="Use the Upload button in the top bar to add images or short videos. They will appear here organized by date."
					icon={Images}
					title="Add your first photos"
				/>
			</main>
		);
	}

	return (
		<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
			<PageHeader
				description="Browse and organize every photo and video you upload."
				title="Photos"
			/>
			<div className="grid gap-10">
				{groups.map((group) => (
					<section key={group.dateKey}>
						<h2 className="text-lg font-semibold tracking-tight">
							{group.label}
						</h2>
						<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
							{group.items.map((media) => (
								<MediaThumb
									key={media.id}
									media={media}
									onAddToAlbum={setAlbumTarget}
									onDelete={setDeleting}
									onOpen={setSelected}
								/>
							))}
						</div>
					</section>
				))}
			</div>
			<div className="h-12" ref={sentinelRef} />
			{mediaQuery.isFetchingNextPage ? (
				<p className="pb-8 text-center text-sm text-muted-foreground">
					Loading more...
				</p>
			) : null}
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
				onDeleted={(media) => {
					if (selected?.id === media.id) {
						setSelected(null);
					}
				}}
				onOpenChange={(open) => {
					if (!open) {
						setDeleting(null);
					}
				}}
			/>
		</main>
	);
}
