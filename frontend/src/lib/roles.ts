export function isAdmin(roleName: string | undefined) {
	return roleName === "ROLE_ADMIN";
}

export function isFounder(roleName: string | undefined) {
	return roleName === "ROLE_FOUNDER";
}

export function canAccessAdmin(roleName: string | undefined) {
	return isAdmin(roleName) || isFounder(roleName);
}

export function formatRole(roleName: string | undefined) {
	if (roleName === "ROLE_FOUNDER") {
		return "Founder";
	}
	if (roleName === "ROLE_ADMIN") {
		return "Admin";
	}
	if (roleName === "ROLE_USER") {
		return "User";
	}
	return roleName ?? "Unknown";
}
