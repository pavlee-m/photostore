import { createFounder, founderExists } from "#/api/admin.ts";
import { signIn } from "#/api/auth.ts";
import { ApiError } from "#/api/client.ts";
import { getCurrentUser } from "#/api/user.ts";
import type { AuthSnapshot, UserCredentials } from "#/types/auth.ts";

export async function loadAuthSnapshot(): Promise<AuthSnapshot> {
	const [exists, user] = await Promise.all([founderExists(), getCurrentUser()]);
	return {
		founderExists: exists,
		user,
	};
}

export async function createFounderAndSignIn(credentials: UserCredentials) {
	await createFounder(credentials);
	await signIn(credentials);
	const user = await getCurrentUser();
	if (!user) {
		throw new ApiError(401, "Founder was created, but sign-in failed.");
	}
	return user;
}
