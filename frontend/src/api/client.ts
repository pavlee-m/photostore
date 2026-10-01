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

function resolveApiUrl(path: string) {
	const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
	return `${baseUrl}${path}`;
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
