import { FolderPlus, Trash2, X } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { useMediaObjectUrl } from "#/hooks/use-media-object-url.ts";
import type { MediaFile } from "#/types/media.ts";

function formatFileSize(bytes: number) {
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	const units = ["KB", "MB", "GB", "TB"];
	let value = bytes / 1024;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}
	return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function MediaViewer({
	media,
	onAddToAlbum,
	onClose,
	onDelete,
}: {
	media: MediaFile;
	onClose: () => void;
	onAddToAlbum?: (media: MediaFile) => void;
	onDelete?: (media: MediaFile) => void;
}) {
	const { url, error } = useMediaObjectUrl(media.id, "full");
	const isVideo = media.fileType.startsWith("video/");
	const uploadedAt = new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(media.uploadedAt));

	function runAction(action: (media: MediaFile) => void) {
		onClose();
		window.setTimeout(() => action(media), 0);
	}

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				}
			}}
			open
		>
			<DialogContent
				className="flex h-[min(92vh,60rem)] w-[min(94vw,80rem)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl"
				overlayClassName="bg-black/80"
			>
				<DialogHeader className="sr-only">
					<DialogTitle>{media.name}</DialogTitle>
					<DialogDescription>
						Preview and manage this library item.
					</DialogDescription>
				</DialogHeader>
				<Button
					aria-label="Close image"
					className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/65 text-white hover:bg-black/80"
					onClick={onClose}
					size="icon"
					type="button"
					variant="ghost"
				>
					<X className="size-5" />
				</Button>
				<div className="flex min-h-0 flex-1 items-center justify-center bg-black">
					{error ? (
						<p className="px-6 py-4 text-white">Could not load this file.</p>
					) : !url ? (
						<p className="px-6 py-4 text-white">Loading...</p>
					) : isVideo ? (
						<video className="size-full object-contain" controls src={url}>
							<track kind="captions" />
						</video>
					) : (
						<img
							alt={media.name}
							className="size-full object-contain"
							src={url}
						/>
					)}
				</div>
				<section className="flex shrink-0 flex-col gap-4 border-t border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<h2 className="truncate font-semibold text-[var(--sea-ink)]">
							{media.name}
						</h2>
						<dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--sea-ink-soft)] sm:text-sm">
							<div className="flex gap-1">
								<dt>Type:</dt>
								<dd>{media.fileType}</dd>
							</div>
							<div className="flex gap-1">
								<dt>Size:</dt>
								<dd>{formatFileSize(media.size)}</dd>
							</div>
							<div className="flex gap-1">
								<dt>Uploaded:</dt>
								<dd>{uploadedAt}</dd>
							</div>
						</dl>
					</div>
					{onAddToAlbum || onDelete ? (
						<div className="flex shrink-0 gap-2">
							{onAddToAlbum ? (
								<Button
									onClick={() => runAction(onAddToAlbum)}
									size="sm"
									variant="outline"
								>
									<FolderPlus className="size-4" />
									Add to album
								</Button>
							) : null}
							{onDelete ? (
								<Button
									onClick={() => runAction(onDelete)}
									size="sm"
									variant="destructive"
								>
									<Trash2 className="size-4" />
									Delete
								</Button>
							) : null}
						</div>
					) : null}
				</section>
			</DialogContent>
		</Dialog>
	);
}
