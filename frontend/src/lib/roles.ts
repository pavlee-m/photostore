export function isAdmin(roleName: string | undefined) {
	return roleName === "ROLE_ADMIN";
}

export function formatRole(roleName: string | undefined) {
	if (roleName === "ROLE_ADMIN") {
		return "Admin";
	}
	if (roleName === "ROLE_USER") {
		return "User";
	}
	return roleName ?? "Unknown";
}
