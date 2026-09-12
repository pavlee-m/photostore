import { getUploadStatus, initUpload, uploadChunk } from "#/api/media.ts";
import { chunkCountForSize, sha256Hex, sliceChunk } from "#/lib/media.ts";
import type { UploadProgress } from "#/types/media.ts";

function isComplete(progress: UploadProgress) {
	if (progress.uploadStatus === "UPLOADED") {
		return true;
	}
	return (progress.missing?.length ?? 0) === 0;
}

function allChunkIndexes(totalChunks: number) {
	return Array.from({ length: totalChunks }, (_, index) => index);
}

export async function uploadMediaFile(
	file: File,
	options: {
		uploadId?: string;
		onSession?: (info: { uploadId: string; totalChunks: number }) => void;
		onProgress?: (uploadedCount: number, totalChunks: number) => void;
	} = {},
) {
	const totalChunks = chunkCountForSize(file.size);
	let uploadId = options.uploadId;
	let missing = allChunkIndexes(totalChunks);
	let knownTotal = totalChunks;

	if (!uploadId) {
		const fileHash = await sha256Hex(file);
		const started = await initUpload({
			filename: file.name,
			totalSize: file.size,
			totalChunks,
			fileHash,
		});
		if (started.alreadyUploaded) {
			options.onProgress?.(totalChunks, totalChunks);
			return;
		}
		if (!started.uploadId) {
			throw new Error("Upload could not be started.");
		}
		uploadId = started.uploadId;
		options.onSession?.({ uploadId, totalChunks });
	} else {
		options.onSession?.({ uploadId, totalChunks });
		const progress = await getUploadStatus(uploadId);
		knownTotal = progress.totalChunks ?? totalChunks;
		if (isComplete(progress)) {
			options.onProgress?.(knownTotal, knownTotal);
			return;
		}
		missing = progress.missing ?? allChunkIndexes(knownTotal);
	}

	let uploadedCount = knownTotal - missing.length;
	options.onProgress?.(uploadedCount, knownTotal);

	for (const index of missing) {
		const result = await uploadChunk(uploadId, index, sliceChunk(file, index));
		uploadedCount += 1;
		options.onProgress?.(uploadedCount, knownTotal);
		if (result.complete) {
			options.onProgress?.(knownTotal, knownTotal);
			return;
		}
	}

	const finalStatus = await getUploadStatus(uploadId);
	if (!isComplete(finalStatus)) {
		throw new Error("Upload is still incomplete.");
	}
	options.onProgress?.(
		finalStatus.totalChunks ?? knownTotal,
		finalStatus.totalChunks ?? knownTotal,
	);
}
