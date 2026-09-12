import { create } from "zustand";

export type ClientUploadStatus =
	| "queued"
	| "uploading"
	| "retrying"
	| "complete"
	| "failed";

export type ClientUpload = {
	id: string;
	file: File;
	filename: string;
	uploadId?: string;
	totalChunks?: number;
	uploadedCount: number;
	status: ClientUploadStatus;
	error?: string;
	attempt: number;
};

export type ClientSession = {
	id: string;
	expanded: boolean;
	uploads: ClientUpload[];
};

type UploadsState = {
	sessions: ClientSession[];
	enqueue: (files: File[]) => ClientSession | null;
	patchUpload: (
		sessionId: string,
		uploadId: string,
		partial: Partial<ClientUpload>,
	) => void;
	setSessionExpanded: (sessionId: string, expanded: boolean) => void;
	removeSession: (sessionId: string) => void;
	getUpload: (sessionId: string, uploadId: string) => ClientUpload | undefined;
};

function fileKey(file: File) {
	return `${file.name}:${file.size}:${file.lastModified}`;
}

function existingFileKeys(sessions: ClientSession[]) {
	const keys = new Set<string>();
	for (const session of sessions) {
		for (const upload of session.uploads) {
			keys.add(fileKey(upload.file));
		}
	}
	return keys;
}

export function isTerminalStatus(status: ClientUploadStatus) {
	return status === "complete" || status === "failed";
}

export const useUploadsStore = create<UploadsState>((set, get) => ({
	sessions: [],
	enqueue: (files) => {
		const keys = existingFileKeys(get().sessions);
		const unique: File[] = [];
		for (const file of files) {
			const key = fileKey(file);
			if (keys.has(key)) {
				continue;
			}
			keys.add(key);
			unique.push(file);
		}
		if (unique.length === 0) {
			return null;
		}
		const session: ClientSession = {
			id: crypto.randomUUID(),
			expanded: unique.length === 1,
			uploads: unique.map((file) => ({
				id: crypto.randomUUID(),
				file,
				filename: file.name,
				uploadedCount: 0,
				status: "queued",
				attempt: 0,
			})),
		};
		set((state) => ({ sessions: [...state.sessions, session] }));
		return session;
	},
	patchUpload: (sessionId, uploadId, partial) => {
		set((state) => ({
			sessions: state.sessions.map((session) => {
				if (session.id !== sessionId) {
					return session;
				}
				return {
					...session,
					uploads: session.uploads.map((upload) =>
						upload.id === uploadId ? { ...upload, ...partial } : upload,
					),
				};
			}),
		}));
	},
	setSessionExpanded: (sessionId, expanded) => {
		set((state) => ({
			sessions: state.sessions.map((session) =>
				session.id === sessionId ? { ...session, expanded } : session,
			),
		}));
	},
	removeSession: (sessionId) => {
		set((state) => ({
			sessions: state.sessions.filter((session) => session.id !== sessionId),
		}));
	},
	getUpload: (sessionId, uploadId) => {
		const session = get().sessions.find((item) => item.id === sessionId);
		return session?.uploads.find((upload) => upload.id === uploadId);
	},
}));
