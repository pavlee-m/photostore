import { toast } from "sonner";
import { ApiError } from "#/api/client.ts";
import {
	showSessionErrorToast,
	showSessionLoadingToast,
} from "#/components/upload-session-toast.tsx";
import { getApiErrorMessage } from "#/lib/api-error.ts";
import { createTaskQueue } from "#/lib/task-queue.ts";
import { uploadMediaFile } from "#/lib/upload.ts";
import { isTerminalStatus, useUploadsStore } from "#/stores/uploads.ts";

const fileQueue = createTaskQueue(2);
const retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
const RETRY_BASE_MS = 2000;
const RETRY_MAX_MS = 30_000;
const SUCCESS_TOAST_MS = 4000;

const PERMANENT_CODES = new Set([
	"INVALID_FILE",
	"FILE_TOO_LARGE",
	"STORAGE_CAPACITY_EXCEEDED",
]);

type CompleteHandler = () => Promise<void> | void;

let onFileComplete: CompleteHandler | undefined;

export function setUploadCompleteHandler(handler: CompleteHandler) {
	onFileComplete = handler;
}

function retryKey(sessionId: string, uploadId: string) {
	return `${sessionId}:${uploadId}`;
}

function isUnauthorized(error: unknown) {
	return error instanceof ApiError && error.status === 401;
}

function isSessionGone(error: unknown) {
	return error instanceof ApiError && error.status === 403;
}

function isPermanentError(error: unknown) {
	if (error instanceof ApiError) {
		if (error.code && PERMANENT_CODES.has(error.code)) {
			return true;
		}
		if (error.status === 401 || error.status === 403) {
			return false;
		}
		if (error.status === 0 || error.status === 408 || error.status === 429) {
			return false;
		}
		if (error.status >= 500) {
			return false;
		}
		if (error.status >= 400 && error.status < 500) {
			return true;
		}
		return false;
	}
	if (
		error instanceof Error &&
		error.message === "Upload could not be started."
	) {
		return true;
	}
	return false;
}

function clearRetryTimer(sessionId: string, uploadId: string) {
	const key = retryKey(sessionId, uploadId);
	const timer = retryTimers.get(key);
	if (timer) {
		clearTimeout(timer);
		retryTimers.delete(key);
	}
}

function clearAllRetryTimers() {
	for (const timer of retryTimers.values()) {
		clearTimeout(timer);
	}
	retryTimers.clear();
}

function finishSessionIfDone(sessionId: string) {
	const session = useUploadsStore
		.getState()
		.sessions.find((item) => item.id === sessionId);
	if (!session) {
		return;
	}
	if (session.uploads.some((upload) => !isTerminalStatus(upload.status))) {
		return;
	}

	const succeeded = session.uploads.filter(
		(upload) => upload.status === "complete",
	).length;
	const failed = session.uploads.length - succeeded;

	if (failed === 0) {
		toast.success(
			succeeded === 1 ? "Photo uploaded." : `${succeeded} photos uploaded.`,
			{
				id: sessionId,
				duration: SUCCESS_TOAST_MS,
				onAutoClose: () => useUploadsStore.getState().removeSession(sessionId),
				onDismiss: () => useUploadsStore.getState().removeSession(sessionId),
			},
		);
		return;
	}

	showSessionErrorToast(sessionId);
}

function failAllForAuth(error: unknown) {
	clearAllRetryTimers();
	const message = getApiErrorMessage(
		error,
		"Your session has expired. Please sign in again.",
	);
	const sessions = useUploadsStore.getState().sessions;
	for (const session of sessions) {
		for (const upload of session.uploads) {
			if (!isTerminalStatus(upload.status)) {
				useUploadsStore.getState().patchUpload(session.id, upload.id, {
					status: "failed",
					error: message,
				});
			}
		}
		finishSessionIfDone(session.id);
	}
}

function scheduleRetry(sessionId: string, uploadId: string, error: unknown) {
	const upload = useUploadsStore.getState().getUpload(sessionId, uploadId);
	if (!upload || isTerminalStatus(upload.status)) {
		return;
	}
	const attempt = upload.attempt + 1;
	const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (attempt - 1));
	useUploadsStore.getState().patchUpload(sessionId, uploadId, {
		status: "retrying",
		attempt,
		error: getApiErrorMessage(error, "Upload failed. Retrying…"),
	});
	showSessionLoadingToast(sessionId);
	clearRetryTimer(sessionId, uploadId);
	retryTimers.set(
		retryKey(sessionId, uploadId),
		setTimeout(() => {
			retryTimers.delete(retryKey(sessionId, uploadId));
			queueUpload(sessionId, uploadId);
		}, delay),
	);
}

async function runUpload(sessionId: string, uploadId: string) {
	const upload = useUploadsStore.getState().getUpload(sessionId, uploadId);
	if (!upload || isTerminalStatus(upload.status)) {
		return;
	}

	useUploadsStore.getState().patchUpload(sessionId, uploadId, {
		status: "uploading",
		error: undefined,
	});

	try {
		await uploadMediaFile(upload.file, {
			uploadId: upload.uploadId,
			onSession: ({ uploadId: backendId, totalChunks }) => {
				useUploadsStore.getState().patchUpload(sessionId, uploadId, {
					uploadId: backendId,
					totalChunks,
				});
			},
			onProgress: (uploadedCount, totalChunks) => {
				useUploadsStore.getState().patchUpload(sessionId, uploadId, {
					uploadedCount,
					totalChunks,
				});
			},
		});
		useUploadsStore.getState().patchUpload(sessionId, uploadId, {
			status: "complete",
			error: undefined,
		});
		await onFileComplete?.();
		finishSessionIfDone(sessionId);
	} catch (error) {
		if (isUnauthorized(error)) {
			failAllForAuth(error);
			return;
		}
		if (isSessionGone(error)) {
			useUploadsStore.getState().patchUpload(sessionId, uploadId, {
				uploadId: undefined,
			});
			scheduleRetry(sessionId, uploadId, error);
			return;
		}
		if (isPermanentError(error)) {
			useUploadsStore.getState().patchUpload(sessionId, uploadId, {
				status: "failed",
				error: getApiErrorMessage(error, "Upload failed. Try again."),
			});
			finishSessionIfDone(sessionId);
			return;
		}
		scheduleRetry(sessionId, uploadId, error);
	}
}

function queueUpload(sessionId: string, uploadId: string) {
	void fileQueue.run(() => runUpload(sessionId, uploadId));
}

export function enqueueUploads(files: File[]) {
	const session = useUploadsStore.getState().enqueue(files);
	if (!session) {
		toast.error("Those files are already uploading.");
		return;
	}
	showSessionLoadingToast(session.id);
	for (const upload of session.uploads) {
		queueUpload(session.id, upload.id);
	}
}
