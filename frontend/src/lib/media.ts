const CHUNK_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "bmp", "gif", "mp4"]);

export async function sha256Hex(file: Blob) {
	const buffer = await file.arrayBuffer();
	const digest = await crypto.subtle.digest("SHA-256", buffer);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

export function fileExtension(filename: string) {
	const dot = filename.lastIndexOf(".");
	if (dot === -1) {
		return "";
	}
	return filename.slice(dot + 1).toLowerCase();
}

export function isAllowedMediaFile(file: File) {
	return ALLOWED_EXTENSIONS.has(fileExtension(file.name));
}

export function chunkCountForSize(size: number) {
	return Math.max(1, Math.ceil(size / CHUNK_SIZE));
}

export function sliceChunk(file: File, index: number) {
	const start = index * CHUNK_SIZE;
	return file.slice(start, start + CHUNK_SIZE);
}
