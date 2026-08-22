import { z } from "zod";

export const albumSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Enter an album name")
		.max(255, "Album name must be 255 characters or fewer"),
	description: z
		.string()
		.max(255, "Description must be 255 characters or fewer"),
	cover: z.instanceof(File).nullable(),
});

export type AlbumFormInput = z.infer<typeof albumSchema>;
