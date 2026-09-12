import { apiFetch, parseApiError } from "#/api/client.ts";
import type {
	MediaFile,
	UploadInitResponse,
	UploadProgress,
} from "#/types/media.ts";

export async function listMedia(page: number, size: number) {
	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	});
	const response = await apiFetch(`/api/v1/media/list?${params}`);
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return (await response.json()) as MediaFile[];
}

export async function fetchMediaBlob(id: number) {
	const response = await apiFetch(`/api/v1/media/${id}`);
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return response.blob();
}

export async function fetchMediaThumbnail(id: number) {
	const response = await apiFetch(`/api/v1/media/${id}/thumbnail`);
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return response.blob();
}

export async function deleteMedia(id: number) {
	const response = await apiFetch(`/api/v1/media/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
}

export async function initUpload(input: {
	filename: string;
	totalSize: number;
	totalChunks: number;
	fileHash: string;
}) {
	const params = new URLSearchParams({
		filename: input.filename,
		totalSize: String(input.totalSize),
		totalChunks: String(input.totalChunks),
		fileHash: input.fileHash,
	});
	const response = await apiFetch(`/api/v1/media/upload-init?${params}`, {
		method: "POST",
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return (await response.json()) as UploadInitResponse;
}

export async function uploadChunk(
	uploadId: string,
	chunkIndex: number,
	chunk: Blob,
): Promise<{ complete: boolean; mediaId?: number }> {
	const params = new URLSearchParams({
		uploadId,
		chunkIndex: String(chunkIndex),
	});
	const formData = new FormData();
	formData.append("chunk", chunk, `chunk-${chunkIndex}`);
	const response = await apiFetch(`/api/v1/media/upload-chunk?${params}`, {
		method: "POST",
		body: formData,
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
	const text = (await response.text()).trim();
	if (/^\d+$/.test(text)) {
		return { complete: true, mediaId: Number(text) };
	}
	return { complete: false };
}

export async function getUploadStatus(uploadId: string) {
	const params = new URLSearchParams({ uploadId });
	const response = await apiFetch(`/api/v1/media/upload-status?${params}`);
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return (await response.json()) as UploadProgress;
}
