import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export class ApiError extends Error {
	readonly status: number;
	readonly code?: string;

	constructor(status: number, message: string, code?: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
	}
}

const getCookieHeader = createIsomorphicFn()
	.server(() => getRequestHeader("cookie"))
	.client(() => undefined);

function resolveApiUrl(path: string) {
	const configuredBase = import.meta.env.VITE_API_BASE_URL as
		| string
		| undefined;
	if (configuredBase) {
		return `${configuredBase.replace(/\/$/, "")}${path}`;
	}
	if (import.meta.env.SSR) {
		const fromVite =
			typeof import.meta.env.VITE_DEV_API_PROXY === "string"
				? import.meta.env.VITE_DEV_API_PROXY
				: "";
		const fromProcess =
			typeof process !== "undefined" && process.env.VITE_DEV_API_PROXY
				? process.env.VITE_DEV_API_PROXY
				: "";
		const ssrBase = fromVite || fromProcess || "http://localhost:8080";
		return `${ssrBase.replace(/\/$/, "")}${path}`;
	}
	return path;
}

export async function parseApiError(response: Response) {
	const text = await response.text();
	const contentType = response.headers.get("content-type") ?? "";
	if (contentType.includes("application/json") && text) {
		try {
			const body = JSON.parse(text) as {
				message?: string;
				code?: string;
				error?: string;
			};
			return new ApiError(
				response.status,
				body.message ?? body.error ?? text,
				body.code,
			);
		} catch {
			return new ApiError(response.status, text);
		}
	}
	return new ApiError(response.status, text || response.statusText);
}

export async function apiFetch(path: string, init: RequestInit = {}) {
	const headers = new Headers(init.headers);
	const cookie = getCookieHeader();
	if (cookie) {
		headers.set("Cookie", cookie);
	}
	if (
		init.body &&
		typeof init.body === "string" &&
		!headers.has("Content-Type")
	) {
		headers.set("Content-Type", "application/json");
	}

	try {
		return await fetch(resolveApiUrl(path), {
			...init,
			headers,
			credentials: "include",
		});
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw error;
		}
		throw new ApiError(0, "Could not reach the server.", "NETWORK_ERROR");
	}
}
