import type { User } from "#/types/user.ts";

export type AuthSnapshot = {
	user: User | null;
	adminExists: boolean;
};

export type UserCredentials = {
	email: string;
	password: string;
};
