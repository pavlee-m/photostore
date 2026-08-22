import { apiFetch, parseApiError } from "#/api/client.ts";
import type { Album } from "#/types/album.ts";

export async function listAlbums() {
	const response = await apiFetch("/api/v1/albums");
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return (await response.json()) as Album[];
}

export async function addMediaToAlbum(albumId: number, mediaId: number) {
	const response = await apiFetch(
		`/api/v1/albums/${albumId}/media/${mediaId}`,
		{
			method: "POST",
		},
	);
	if (!response.ok) {
		throw await parseApiError(response);
	}
}

export async function fetchAlbumCoverBlob(id: number) {
	const response = await apiFetch(`/api/v1/albums/${id}/cover`);
	if (response.status === 404) {
		return null;
	}
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return response.blob();
}
