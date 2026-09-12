export type MediaFile = {
	id: number;
	name: string;
	fileType: string;
	extension: string;
	size: number;
	uploadedAt: string;
};

export type UploadInitResponse = {
	alreadyUploaded: boolean;
	uploadId?: string;
	mediaId?: number;
};

export type UploadProgress = {
	totalChunks: number;
	missing: number[];
	uploadStatus?: string;
};
