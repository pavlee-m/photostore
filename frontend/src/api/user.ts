import { apiFetch, parseApiError } from "#/api/client.ts";
import type { User } from "#/types/user.ts";

export async function getCurrentUser() {
	const response = await apiFetch("/api/v1/user/me");
	if (response.status === 401) {
		return null;
	}
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return (await response.json()) as User;
}

export async function updateProfile(input: {
	email: string;
	profilePicture?: File | null;
}) {
	const formData = new FormData();
	formData.append("email", input.email);
	if (input.profilePicture) {
		formData.append("profile_picture", input.profilePicture);
	}
	const response = await apiFetch("/api/v1/user/me", {
		method: "PATCH",
		body: formData,
	});
	if (!response.ok) {
		throw await parseApiError(response);
	}
}

export async function fetchProfilePicture() {
	const response = await apiFetch("/api/v1/user/me/profile-picture");
	if (response.status === 404) {
		return null;
	}
	if (!response.ok) {
		throw await parseApiError(response);
	}
	return response.blob();
}
