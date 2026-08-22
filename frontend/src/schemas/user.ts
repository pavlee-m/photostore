import { z } from "zod";

const roleSchema = z.enum(["ROLE_USER", "ROLE_ADMIN"]);

export const createUserSchema = z
	.object({
		email: z.email("Enter a valid email address"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Confirm your password"),
		storage_space: z
			.number()
			.min(1, "Storage must be at least 1 MB")
			.max(102400, "Storage cannot exceed 100 GB"),
		roleName: roleSchema,
	})
	.refine((value) => value.password === value.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const editUserSchema = z.object({
	email: z.email("Enter a valid email address"),
	storage_space: z
		.number()
		.min(1, "Storage must be at least 1 MB")
		.max(102400, "Storage cannot exceed 100 GB"),
	roleName: roleSchema,
	password: z
		.string()
		.refine(
			(value) => value.length === 0 || value.length >= 8,
			"Password must be at least 8 characters",
		),
});

export const editProfileSchema = z.object({
	email: z.email("Enter a valid email address"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;
export type EditProfileInput = z.infer<typeof editProfileSchema>;
