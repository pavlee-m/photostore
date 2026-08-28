import type { User } from "#/types/user.ts";

export type AuthSnapshot = {
	user: User | null;
	founderExists: boolean;
};

export type UserCredentials = {
	email: string;
	password: string;
};
