import { X } from "lucide-react";
import { useEffect } from "react";
import { useMediaObjectUrl } from "#/hooks/use-media-object-url.ts";
import type { MediaFile } from "#/types/media.ts";

export function MediaViewer({
	media,
	onClose,
}: {
	media: MediaFile;
	onClose: () => void;
}) {
	const { url, error } = useMediaObjectUrl(media.id, "full");
	const isVideo = media.fileType.startsWith("video/");

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
			}
		}
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
			<button
				aria-label="Close image"
				className="absolute inset-0 bg-black/80"
				onClick={onClose}
				type="button"
			/>
			<div
				aria-modal="true"
				className="relative max-h-[90vh] max-w-[90vw]"
				role="dialog"
			>
				<button
					aria-label="Close image"
					className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/65 text-white hover:bg-black/80"
					onClick={onClose}
					type="button"
				>
					<X className="size-5" />
				</button>
				{error ? (
					<p className="rounded-xl bg-black/60 px-6 py-4 text-white">
						Could not load this file.
					</p>
				) : !url ? (
					<p className="rounded-xl bg-black/60 px-6 py-4 text-white">
						Loading...
					</p>
				) : isVideo ? (
					<video
						className="max-h-[90vh] max-w-[90vw] rounded-xl bg-black"
						controls
						src={url}
					>
						<track kind="captions" />
					</video>
				) : (
					<img
						alt={media.name}
						className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
						src={url}
					/>
				)}
			</div>
		</div>
	);
}
