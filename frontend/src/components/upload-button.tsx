import { Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import { isAllowedMediaFile } from "#/lib/media.ts";
import { enqueueUploads } from "#/lib/upload-manager.ts";

export function UploadButton() {
	const inputRef = useRef<HTMLInputElement>(null);

	function handleFiles(fileList: FileList | null) {
		if (!fileList || fileList.length === 0) {
			return;
		}
		const files = [...fileList].filter(isAllowedMediaFile);
		if (files.length === 0) {
			toast.error("Use jpg, png, gif, bmp, or mp4 files.");
			return;
		}
		enqueueUploads(files);
		if (inputRef.current) {
			inputRef.current.value = "";
		}
	}

	return (
		<>
			<input
				accept=".jpg,.jpeg,.png,.bmp,.gif,.mp4,image/*,video/mp4"
				className="sr-only"
				multiple
				onChange={(event) => handleFiles(event.target.files)}
				ref={inputRef}
				type="file"
			/>
			<Button
				aria-label="Upload photos"
				onClick={() => inputRef.current?.click()}
				size="sm"
			>
				<Upload className="size-4" />
				<span className="hidden sm:inline">Upload</span>
			</Button>
		</>
	);
}
