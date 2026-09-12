import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCurrentUser } from "#/api/user.ts";
import { setUploadCompleteHandler } from "#/lib/upload-manager.ts";
import { useAuthStore } from "#/stores/auth.ts";

export function UploadToastsHost() {
	const queryClient = useQueryClient();

	useEffect(() => {
		setUploadCompleteHandler(async () => {
			await queryClient.invalidateQueries({ queryKey: ["media-list"] });
			const user = await getCurrentUser();
			if (user) {
				useAuthStore.getState().setUser(user);
			}
		});
	}, [queryClient]);

	return null;
}
