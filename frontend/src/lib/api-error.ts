import { toast } from "sonner";
import { ApiError } from "#/api/client.ts";

const CODE_MESSAGES: Record<string, string> = {
	INVALID_CREDENTIALS: "Invalid email or password.",
	INVALID_PASSWORD: "The password is incorrect.",
	EMAIL_ALREADY_EXISTS: "An account with that email already exists.",
	USER_NOT_FOUND: "That user could not be found.",
	MEDIA_NOT_FOUND: "This photo could not be found.",
	THUMBNAIL_NOT_FOUND: "The preview for this photo could not be loaded.",
	ALBUM_NOT_FOUND: "That album could not be found.",
	ALBUM_COVER_NOT_FOUND: "This album has no cover image.",
	PROFILE_PICTURE_NOT_FOUND: "No profile picture is set.",
	MEDIA_ALREADY_IN_ALBUM: "This photo is already in that album.",
	ROLE_NOT_FOUND: "That role could not be found.",
	INVALID_FILE: "This file could not be uploaded.",
	STORAGE_CAPACITY_EXCEEDED: "Storage limit exceeded.",
	FILE_TOO_LARGE: "This file is too large to upload.",
	STORAGE_OPERATION_FAILED: "The file could not be stored. Please try again.",
	INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",
	NOT_FOUND: "The requested resource was not found.",
	METHOD_NOT_ALLOWED: "This action is not supported.",
	NETWORK_ERROR: "Could not reach the server. Check your connection.",
};

const PREFER_BACKEND_MESSAGE = new Set(["INVALID_FILE", "BAD_REQUEST"]);

function isUserFacingMessage(message: string) {
	const trimmed = message.trim();
	if (!trimmed || trimmed.length > 200) {
		return false;
	}
	const lower = trimmed.toLowerCase();
	if (lower.startsWith("<!doctype") || lower.startsWith("<html")) {
		return false;
	}
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
		return false;
	}
	return true;
}

function messageForStatus(status: number) {
	if (status === 0) {
		return CODE_MESSAGES.NETWORK_ERROR;
	}
	if (status === 401) {
		return "Your session has expired. Please sign in again.";
	}
	if (status === 403) {
		return "You do not have permission to do that.";
	}
	if (status === 404) {
		return CODE_MESSAGES.NOT_FOUND;
	}
	if (status === 409) {
		return "This action conflicts with the current state.";
	}
	if (status === 413) {
		return CODE_MESSAGES.FILE_TOO_LARGE;
	}
	if (status === 429) {
		return "Too many requests. Please wait and try again.";
	}
	if (status >= 500) {
		return CODE_MESSAGES.INTERNAL_SERVER_ERROR;
	}
	return "The request could not be completed.";
}

export function getApiErrorMessage(
	error: unknown,
	fallback = "Something went wrong. Please try again.",
) {
	if (error instanceof ApiError) {
		if (
			error.code &&
			PREFER_BACKEND_MESSAGE.has(error.code) &&
			isUserFacingMessage(error.message)
		) {
			return error.message;
		}
		if (error.code && CODE_MESSAGES[error.code]) {
			return CODE_MESSAGES[error.code];
		}
		if (isUserFacingMessage(error.message)) {
			return error.message;
		}
		return messageForStatus(error.status);
	}
	if (error instanceof Error && isUserFacingMessage(error.message)) {
		return error.message;
	}
	return fallback;
}

export function toastApiError(error: unknown, fallback?: string) {
	if (typeof window === "undefined") {
		return;
	}
	toast.error(getApiErrorMessage(error, fallback));
}
