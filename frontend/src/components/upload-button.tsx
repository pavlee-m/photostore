import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { getCurrentUser } from "#/api/user.ts";
import { Button } from "#/components/ui/button.tsx";
import { Progress } from "#/components/ui/progress.tsx";
import { getApiErrorMessage } from "#/lib/api-error.ts";
import { isAllowedMediaFile } from "#/lib/media.ts";
import { uploadMediaFile } from "#/lib/upload.ts";
import { useAuthStore } from "#/stores/auth.ts";

function showUploadProgress(
	toastId: string | number,
	current: number,
	total: number,
	fileRatio: number,
) {
	const value = ((current - 1 + fileRatio) / total) * 100;
	toast.loading(`Uploading ${current} of ${total}`, {
		id: toastId,
		description: <Progress className="mt-1.5" value={value} />,
	});
}

export function UploadButton() {
	const inputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();
	const [busy, setBusy] = useState(false);

	async function handleFiles(fileList: FileList | null) {
		if (!fileList || fileList.length === 0) {
			return;
		}
		const files = [...fileList].filter(isAllowedMediaFile);
		if (files.length === 0) {
			toast.error("Use jpg, png, gif, bmp, or mp4 files.");
			return;
		}
		const toastId = toast.loading(`Uploading 1 of ${files.length}`, {
			description: <Progress className="mt-1.5" value={0} />,
		});
		setBusy(true);
		try {
			for (let index = 0; index < files.length; index += 1) {
				const file = files[index];
				if (!file) {
					continue;
				}
				await uploadMediaFile(file, (ratio) => {
					showUploadProgress(toastId, index + 1, files.length, ratio);
				});
			}
			await queryClient.invalidateQueries({ queryKey: ["media-list"] });
			const user = await getCurrentUser();
			if (user) {
				useAuthStore.getState().setUser(user);
			}
			toast.success(
				files.length === 1
					? "Photo uploaded."
					: `${files.length} photos uploaded.`,
				{ id: toastId, description: undefined },
			);
		} catch (error) {
			toast.error(getApiErrorMessage(error, "Upload failed. Try again."), {
				description: undefined,
				id: toastId,
			});
		} finally {
			setBusy(false);
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		}
	}

	return (
		<>
			<input
				accept=".jpg,.jpeg,.png,.bmp,.gif,.mp4,image/*,video/mp4"
				className="sr-only"
				disabled={busy}
				multiple
				onChange={(event) => void handleFiles(event.target.files)}
				ref={inputRef}
				type="file"
			/>
			<Button
				aria-label="Upload photos"
				disabled={busy}
				onClick={() => inputRef.current?.click()}
				size="sm"
			>
				<Upload className="size-4" />
				<span className="hidden sm:inline">Upload</span>
			</Button>
		</>
	);
}
