import { initUpload, uploadChunk } from "#/api/media.ts";
import { chunkCountForSize, sha256Hex, sliceChunk } from "#/lib/media.ts";

export async function uploadMediaFile(
	file: File,
	onProgress?: (ratio: number) => void,
) {
	onProgress?.(0);
	const fileHash = await sha256Hex(file);
	const totalChunks = chunkCountForSize(file.size);
	const started = await initUpload({
		filename: file.name,
		totalSize: file.size,
		totalChunks,
		fileHash,
	});
	if (started.alreadyUploaded) {
		onProgress?.(1);
		return;
	}
	if (!started.uploadId) {
		throw new Error("Upload could not be started.");
	}
	for (let index = 0; index < totalChunks; index += 1) {
		await uploadChunk(started.uploadId, index, sliceChunk(file, index));
		onProgress?.((index + 1) / totalChunks);
	}
}
