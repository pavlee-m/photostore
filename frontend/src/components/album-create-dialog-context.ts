import { createContext, useContext } from "react";

export const AlbumCreateDialogContext = createContext<(() => void) | null>(
	null,
);

export function useAlbumCreateDialog() {
	const openDialog = useContext(AlbumCreateDialogContext);
	if (!openDialog) {
		throw new Error(
			"useAlbumCreateDialog must be used inside the authenticated app shell",
		);
	}
	return openDialog;
}
