export type AdminCreateUserRequest = {
	email: string;
	password: string;
	storage_space?: number;
	roleName?: string;
};

export type AdminUpdateUserRequest = {
	email?: string;
	storage_space?: number;
	roleName?: string;
};
