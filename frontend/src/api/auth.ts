import { apiFetch, parseApiError } from "#/api/client.ts";
import type { UserCredentials } from "#/types/auth.ts";

export async function signIn(credentials: UserCredentials) {
	const response = await apiFetch("/api/v1/auth/signin", {
		method: "POST",
		body: JSON.stringify(credentials),
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
}

export async function signOut() {
	const response = await apiFetch("/api/v1/user/logout", {
		method: "POST",
	});
	if (!response.ok && response.status !== 401) {
		throw await parseApiError(response);
	}
}
