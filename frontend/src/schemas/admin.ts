import { z } from "zod";

export const createAdminSchema = z
	.object({
		email: z.email("Enter a valid email address"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Confirm your password"),
	})
	.refine((value) => value.password === value.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
