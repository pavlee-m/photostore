import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addMediaToAlbum, listAlbums } from "#/api/album.ts";
import { AlbumCover } from "#/components/album-cover.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import type { MediaFile } from "#/types/media.ts";

export function AddToAlbumDialog({
	media,
	onOpenChange,
	open,
}: {
	media: MediaFile | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const queryClient = useQueryClient();
	const albumsQuery = useQuery({
		queryKey: ["albums"],
		queryFn: listAlbums,
		enabled: open,
	});
	const addMutation = useMutation({
		mutationFn: ({ albumId, mediaId }: { albumId: number; mediaId: number }) =>
			addMediaToAlbum(albumId, mediaId),
		onSuccess: async (_, { albumId }) => {
			await queryClient.invalidateQueries({
				queryKey: ["album-media", albumId],
			});
			onOpenChange(false);
			toast.success("Photo added to album.");
		},
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Add to album</DialogTitle>
					<DialogDescription>
						Choose an album for {media?.name ?? "this photo"}.
					</DialogDescription>
				</DialogHeader>
				{albumsQuery.isLoading ? (
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Loading albums...
					</p>
				) : albumsQuery.isError ? (
					<p className="text-destructive text-sm">Could not load albums.</p>
				) : !albumsQuery.data?.length ? (
					<p className="text-sm text-[var(--sea-ink-soft)]">
						You do not have any albums yet. Create one from the Albums page,
						then come back and add this photo.
					</p>
				) : (
					<div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
						{albumsQuery.data.map((album) => (
							<Button
								className="h-auto flex-col items-stretch gap-2 whitespace-normal p-2"
								disabled={addMutation.isPending || media == null}
								key={album.id}
								onClick={() => {
									if (!media) {
										return;
									}
									addMutation.mutate({
										albumId: album.id,
										mediaId: media.id,
									});
								}}
								type="button"
								variant="outline"
							>
								<div className="aspect-square overflow-hidden rounded-lg">
									<AlbumCover album={album} />
								</div>
								<span className="truncate text-left text-sm font-medium">
									{album.name}
								</span>
							</Button>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
