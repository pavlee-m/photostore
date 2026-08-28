import {
	FolderMinus,
	FolderPlus,
	MoreHorizontal,
	Play,
	Trash2,
} from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
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
	const hasActions = onAddToAlbum || onRemoveFromAlbum || onDelete;

	function deferAction(action: (media: MediaFile) => void) {
		window.setTimeout(() => action(media), 0);
	}

	const actions = (
		<>
			{onAddToAlbum ? (
				<DropdownMenuItem onSelect={() => deferAction(onAddToAlbum)}>
					<FolderPlus />
					Add to album
				</DropdownMenuItem>
			) : null}
			{onRemoveFromAlbum ? (
				<DropdownMenuItem onSelect={() => deferAction(onRemoveFromAlbum)}>
					<FolderMinus />
					Remove from album
				</DropdownMenuItem>
			) : null}
			{onDelete && (onAddToAlbum || onRemoveFromAlbum) ? (
				<DropdownMenuSeparator />
			) : null}
			{onDelete ? (
				<DropdownMenuItem
					onSelect={() => deferAction(onDelete)}
					variant="destructive"
				>
					<Trash2 />
					Delete
				</DropdownMenuItem>
			) : null}
		</>
	);

	return (
		<div className="group relative" ref={setNode}>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<button
						aria-label={`Open ${media.name}`}
						className="aspect-square w-full cursor-pointer overflow-hidden rounded-lg border bg-muted transition-colors outline-none hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						onClick={() => onOpen(media)}
						type="button"
					>
						{isVideo ? (
							<span className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
								<Play className="size-8 fill-current" />
								<span className="px-2 text-xs">Video</span>
							</span>
						) : error ? (
							<span className="flex size-full items-center justify-center px-2 text-xs text-muted-foreground">
								Could not load
							</span>
						) : !url ? (
							<Skeleton className="size-full rounded-none" />
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
			{hasActions ? (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							aria-label={`Actions for ${media.name}`}
							className="absolute top-2 right-2 size-8 bg-background/90 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background group-focus-within:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
							size="icon"
							variant="outline"
						>
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">{actions}</DropdownMenuContent>
				</DropdownMenu>
			) : null}
		</div>
	);
}
