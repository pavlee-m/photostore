import { apiFetch, parseApiError } from "#/api/client.ts";
import type { Album } from "#/types/album.ts";
import type { MediaFile } from "#/types/media.ts";

export type AlbumInput = {
	name: string;
	description: string;
	cover?: File | null;
};

function albumFormData(input: AlbumInput) {
	const formData = new FormData();
	formData.append("name", input.name);
	formData.append("description", input.description);
	if (input.cover) {
		formData.append("cover", input.cover);
	}
	return formData;
}

export async function listAlbums() {
	const response = await apiFetch("/api/v1/albums");
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return (await response.json()) as Album[];
}

export async function createAlbum(input: AlbumInput) {
	const response = await apiFetch("/api/v1/albums", {
		method: "POST",
		body: albumFormData(input),
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return (await response.json()) as Album;
}

export async function updateAlbum(id: number, input: AlbumInput) {
	const response = await apiFetch(`/api/v1/albums/${id}`, {
		method: "PATCH",
		body: albumFormData(input),
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return (await response.json()) as Album;
}

export async function deleteAlbum(id: number) {
	const response = await apiFetch(`/api/v1/albums/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
}

export async function listAlbumMedia(albumId: number) {
	const response = await apiFetch(`/api/v1/albums/${albumId}/media`);
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return (await response.json()) as MediaFile[];
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

export async function removeMediaFromAlbum(albumId: number, mediaId: number) {
	const response = await apiFetch(
		`/api/v1/albums/${albumId}/media/${mediaId}`,
		{
			method: "DELETE",
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
