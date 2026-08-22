export type Role = {
	id: number;
	name: string;
};

export type User = {
	id: number;
	email: string;
	profile_picture_url: string | null;
	storage_space: number;
	storage_used: number;
	role: Role;
};
