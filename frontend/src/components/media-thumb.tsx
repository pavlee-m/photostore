import { FolderMinus, FolderPlus, Play, Trash2 } from "lucide-react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "#/components/ui/context-menu.tsx";
import { useInView } from "#/hooks/use-in-view.ts";
import { useMediaObjectUrl } from "#/hooks/use-media-object-url.ts";
import type { MediaFile } from "#/types/media.ts";

export function MediaThumb({
	media,
	onAddToAlbum,
	onDelete,
	onOpen,
	onRemoveFromAlbum,
}: {
	media: MediaFile;
	onOpen: (media: MediaFile) => void;
	onDelete?: (media: MediaFile) => void;
	onAddToAlbum?: (media: MediaFile) => void;
	onRemoveFromAlbum?: (media: MediaFile) => void;
}) {
	const { setNode, visible } = useInView<HTMLDivElement>();
	const isVideo = media.fileType.startsWith("video/");
	const { url, error } = useMediaObjectUrl(
		media.id,
		"thumb",
		visible && !isVideo,
	);

	return (
		<div ref={setNode}>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<button
						className="aspect-square w-full cursor-pointer overflow-hidden rounded-xl bg-[color-mix(in_oklab,var(--chip-bg)_80%,black)]"
						onClick={() => onOpen(media)}
						type="button"
					>
						{isVideo ? (
							<span className="flex size-full flex-col items-center justify-center gap-1 text-[var(--sea-ink-soft)]">
								<Play className="size-8 fill-current" />
								<span className="px-2 text-xs">Video</span>
							</span>
						) : error ? (
							<span className="flex size-full items-center justify-center px-2 text-xs text-[var(--sea-ink-soft)]">
								Could not load
							</span>
						) : !url ? (
							<span className="block size-full animate-pulse bg-[color-mix(in_oklab,var(--chip-bg)_70%,black)]" />
						) : (
							<img
								alt={media.name}
								className="size-full object-cover"
								decoding="async"
								src={url}
							/>
						)}
					</button>
				</ContextMenuTrigger>
				<ContextMenuContent>
					{onAddToAlbum ? (
						<ContextMenuItem
							onSelect={() => {
								window.setTimeout(() => onAddToAlbum(media), 0);
							}}
						>
							<FolderPlus />
							Add to album
						</ContextMenuItem>
					) : null}
					{onRemoveFromAlbum ? (
						<ContextMenuItem
							onSelect={() => {
								window.setTimeout(() => onRemoveFromAlbum(media), 0);
							}}
						>
							<FolderMinus />
							Remove from album
						</ContextMenuItem>
					) : null}
					{onDelete && (onAddToAlbum || onRemoveFromAlbum) ? (
						<ContextMenuSeparator />
					) : null}
					{onDelete ? (
						<ContextMenuItem
							onSelect={() => {
								window.setTimeout(() => onDelete(media), 0);
							}}
							variant="destructive"
						>
							<Trash2 />
							Delete
						</ContextMenuItem>
					) : null}
				</ContextMenuContent>
			</ContextMenu>
		</div>
	);
}
