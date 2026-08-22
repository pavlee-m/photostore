import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { deleteMedia, listMedia } from "#/api/media.ts";
import { getCurrentUser } from "#/api/user.ts";
import { AddToAlbumDialog } from "#/components/add-to-album-dialog.tsx";
import { MediaThumb } from "#/components/media-thumb.tsx";
import { MediaViewer } from "#/components/media-viewer.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { forgetMediaObjectUrl } from "#/hooks/use-media-object-url.ts";
import { toastApiError } from "#/lib/api-error.ts";
import { groupMediaByDate } from "#/lib/dates.ts";
import { useAuthStore } from "#/stores/auth.ts";
import type { MediaFile } from "#/types/media.ts";

const PAGE_SIZE = 24;

export function PhotosLibrary() {
	const queryClient = useQueryClient();
	const [selected, setSelected] = useState<MediaFile | null>(null);
	const [deleting, setDeleting] = useState<MediaFile | null>(null);
	const [albumTarget, setAlbumTarget] = useState<MediaFile | null>(null);
	const [deletingBusy, setDeletingBusy] = useState(false);
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

	async function handleDelete() {
		if (!deleting) {
			return;
		}
		setDeletingBusy(true);
		try {
			await deleteMedia(deleting.id);
			forgetMediaObjectUrl(deleting.id);
			if (selected?.id === deleting.id) {
				setSelected(null);
			}
			setDeleting(null);
			await queryClient.invalidateQueries({ queryKey: ["media-list"] });
			const user = await getCurrentUser();
			if (user) {
				useAuthStore.getState().setUser(user);
			}
		} catch (error) {
			toastApiError(error, "Could not delete this photo.");
		} finally {
			setDeletingBusy(false);
		}
	}

	if (mediaQuery.isLoading) {
		return (
			<main className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-6">
				<p className="text-[var(--sea-ink-soft)]">Loading your photos...</p>
			</main>
		);
	}

	if (mediaQuery.isError) {
		return (
			<main className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-6">
				<p className="text-destructive">Could not load your photos.</p>
			</main>
		);
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
				<MediaViewer media={selected} onClose={() => setSelected(null)} />
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
						<DialogTitle>Delete photo</DialogTitle>
						<DialogDescription>
							Delete {deleting?.name}? This cannot be undone.
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
							disabled={deletingBusy}
							onClick={() => void handleDelete()}
							variant="destructive"
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}
