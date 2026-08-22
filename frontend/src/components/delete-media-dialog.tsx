import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { deleteMedia } from "#/api/media.ts";
import { getCurrentUser } from "#/api/user.ts";
import { ConfirmationDialog } from "#/components/confirmation-dialog.tsx";
import { forgetMediaObjectUrl } from "#/hooks/use-media-object-url.ts";
import { toastApiError } from "#/lib/api-error.ts";
import { useAuthStore } from "#/stores/auth.ts";
import type { MediaFile } from "#/types/media.ts";

export function DeleteMediaDialog({
	media,
	onDeleted,
	onOpenChange,
}: {
	media: MediaFile | null;
	onDeleted?: (media: MediaFile) => Promise<void> | void;
	onOpenChange: (open: boolean) => void;
}) {
	const queryClient = useQueryClient();
	const [busy, setBusy] = useState(false);

	async function handleDelete() {
		if (!media) {
			return;
		}
		setBusy(true);
		try {
			await deleteMedia(media.id);
			forgetMediaObjectUrl(media.id);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["media-list"] }),
				queryClient.invalidateQueries({ queryKey: ["album-media"] }),
			]);
			const user = await getCurrentUser();
			if (user) {
				useAuthStore.getState().setUser(user);
			}
			await onDeleted?.(media);
			onOpenChange(false);
			toast.success("Photo deleted.");
		} catch (error) {
			toastApiError(error, "Could not delete this photo.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<ConfirmationDialog
			busy={busy}
			busyLabel="Deleting..."
			confirmLabel="Delete photo"
			description={
				<>
					Delete {media?.name}? This removes it from your library and every
					album. This cannot be undone.
				</>
			}
			onConfirm={handleDelete}
			onOpenChange={onOpenChange}
			open={media !== null}
			title="Delete photo"
		/>
	);
}
