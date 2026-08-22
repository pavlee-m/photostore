import { adminExists, createAdmin } from "#/api/admin.ts";
import { signIn } from "#/api/auth.ts";
import { ApiError } from "#/api/client.ts";
import { getCurrentUser } from "#/api/user.ts";
import type { AuthSnapshot, UserCredentials } from "#/types/auth.ts";

export async function loadAuthSnapshot(): Promise<AuthSnapshot> {
	const [exists, user] = await Promise.all([adminExists(), getCurrentUser()]);
	return {
		adminExists: exists,
		user,
	};
}

export async function createAdminAndSignIn(credentials: UserCredentials) {
	await createAdmin(credentials);
	await signIn(credentials);
	const user = await getCurrentUser();
	if (!user) {
		throw new ApiError(401, "Admin was created, but sign-in failed.");
	}
	return user;
}
