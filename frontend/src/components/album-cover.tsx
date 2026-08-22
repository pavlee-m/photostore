import { FolderOpen } from "lucide-react";
import { useAlbumCoverUrl } from "#/hooks/use-album-cover-url.ts";
import { cn } from "#/lib/utils.ts";
import type { Album } from "#/types/album.ts";

export function AlbumCover({
	album,
	className,
}: {
	album: Album;
	className?: string;
}) {
	const hasCover = Boolean(album.coverPhotoUrl);
	const { url, error } = useAlbumCoverUrl(hasCover ? album.id : null);

	if (!hasCover || error || !url) {
		return (
			<div
				className={cn(
					"flex size-full items-center justify-center bg-[color-mix(in_oklab,var(--chip-bg)_80%,black)] text-[var(--sea-ink-soft)]",
					className,
				)}
			>
				<FolderOpen className="size-8" />
			</div>
		);
	}

	return (
		<img alt="" className={cn("size-full object-cover", className)} src={url} />
	);
}
