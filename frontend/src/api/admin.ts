import { apiFetch, parseApiError } from "#/api/client.ts";
import type {
	AdminCreateUserRequest,
	AdminUpdateUserRequest,
} from "#/types/admin.ts";
import type { UserCredentials } from "#/types/auth.ts";
import type { PagedResponse } from "#/types/page.ts";
import type { User } from "#/types/user.ts";

export async function founderExists() {
	const response = await apiFetch("/api/v1/founder/exists-founder");
	if (response.ok) {
		return (await response.json()) as boolean;
	}
	throw await parseApiError(response);
}

export async function createFounder(credentials: UserCredentials) {
	const response = await apiFetch("/api/v1/founder/create-founder", {
		method: "POST",
		body: JSON.stringify(credentials),
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
}

export async function listUsers(page = 0, size = 10) {
	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	});
	const response = await apiFetch(`/api/v1/admin/users?${params}`);
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return (await response.json()) as PagedResponse<User>;
}

export async function createUser(request: AdminCreateUserRequest) {
	const response = await apiFetch("/api/v1/admin/create-user", {
		method: "POST",
		body: JSON.stringify(request),
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
}

export async function deleteUser(id: number) {
	const response = await apiFetch(`/api/v1/admin/delete-user/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
}

export async function updateUser(id: number, request: AdminUpdateUserRequest) {
	const formData = new FormData();
	formData.append(
		"user",
		new Blob([JSON.stringify(request)], { type: "application/json" }),
	);
	const response = await apiFetch(`/api/v1/admin/update-user/${id}`, {
		method: "PATCH",
		body: formData,
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
}

export async function changeUserPassword(id: number, password: string) {
	const response = await apiFetch(`/api/v1/admin/change-password/${id}`, {
		method: "POST",
		headers: {
			"Content-Type": "text/plain",
		},
		body: password,
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
}
