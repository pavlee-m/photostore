import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { listMedia } from "#/api/media.ts";
import { AddToAlbumDialog } from "#/components/add-to-album-dialog.tsx";
import { DeleteMediaDialog } from "#/components/delete-media-dialog.tsx";
import { MediaGridSkeleton } from "#/components/library-skeletons.tsx";
import { LoadErrorState } from "#/components/load-error-state.tsx";
import { MediaThumb } from "#/components/media-thumb.tsx";
import { MediaViewer } from "#/components/media-viewer.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { groupMediaByDate } from "#/lib/dates.ts";
import type { MediaFile } from "#/types/media.ts";

const PAGE_SIZE = 24;

export function PhotosLibrary() {
	const [selected, setSelected] = useState<MediaFile | null>(null);
	const [deleting, setDeleting] = useState<MediaFile | null>(null);
	const [albumTarget, setAlbumTarget] = useState<MediaFile | null>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const mediaQuery = useInfiniteQuery({
		queryKey: ["media-list"],
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
				<Skeleton className="mb-4 h-8 w-40" />
				<MediaGridSkeleton />
			</main>
		);
	}

	if (mediaQuery.isError) {
		return <LoadErrorState message="Could not load your photos." />;
	}

	if (items.length === 0) {
		return (
			<main className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-6">
				<section className="max-w-md text-center">
					<p className="island-kicker">Getting started</p>
					<h2 className="display-title mt-3 text-4xl">Add your first photos</h2>
					<p className="mt-3 text-[var(--sea-ink-soft)]">
						Your library is empty. Use the Upload button in the top bar to add
						images or short videos, then they will show up here by date.
					</p>
				</section>
			</main>
		);
	}

	return (
		<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
			<div className="grid gap-10">
				{groups.map((group) => (
					<section key={group.dateKey}>
						<h2 className="display-title text-2xl">{group.label}</h2>
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
				<p className="pb-8 text-center text-sm text-[var(--sea-ink-soft)]">
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
