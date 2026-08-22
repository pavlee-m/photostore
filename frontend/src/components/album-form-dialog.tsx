import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { createAlbum, updateAlbum } from "#/api/album.ts";
import { AlbumCover } from "#/components/album-cover.tsx";
import { FieldErrors } from "#/components/field-errors.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { forgetAlbumCoverUrl } from "#/hooks/use-album-cover-url.ts";
import { toastApiError } from "#/lib/api-error.ts";
import { albumSchema } from "#/schemas/album.ts";
import type { Album } from "#/types/album.ts";

type AlbumFormDialogProps = {
	album?: Album | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: (album: Album) => Promise<void> | void;
};

export function AlbumFormDialog({
	album,
	open,
	onOpenChange,
	onSaved,
}: AlbumFormDialogProps) {
	const editing = album != null;
	const form = useForm({
		defaultValues: {
			name: album?.name ?? "",
			description: album?.description ?? "",
			cover: null as File | null,
		},
		validators: {
			onSubmit: albumSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const input = {
					name: value.name.trim(),
					description: value.description,
					cover: value.cover,
				};
				const saved = editing
					? await updateAlbum(album.id, input)
					: await createAlbum(input);
				if (editing && value.cover) {
					forgetAlbumCoverUrl(album.id);
				}
				await onSaved(saved);
				form.reset();
				onOpenChange(false);
				toast.success(editing ? "Album updated." : "Album created.");
			} catch (error) {
				toastApiError(
					error,
					editing
						? "Could not update the album."
						: "Could not create the album.",
				);
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: album?.name ?? "",
				description: album?.description ?? "",
				cover: null,
			});
		}
	}, [album, form, open]);

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{editing ? "Edit album" : "Create album"}</DialogTitle>
					<DialogDescription>
						{editing
							? "Update the album details or choose a new cover."
							: "Give your album a name. A description and cover are optional."}
					</DialogDescription>
				</DialogHeader>
				<form
					className="grid gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.Field name="name">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>Name</Label>
								<Input
									autoFocus
									id={field.name}
									maxLength={255}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Summer vacation"
									value={field.state.value}
								/>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<form.Field name="description">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>Description</Label>
								<Textarea
									id={field.name}
									maxLength={255}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="A few words about this collection"
									rows={3}
									value={field.state.value}
								/>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<form.Field name="cover">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>
									{editing ? "New cover" : "Cover"}
								</Label>
								{editing && album.coverPhotoUrl && !field.state.value ? (
									<div className="aspect-[3/1] overflow-hidden rounded-lg">
										<AlbumCover album={album} />
									</div>
								) : null}
								<Input
									accept=".jpg,.jpeg,.png,.bmp,.gif,image/*"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) =>
										field.handleChange(event.target.files?.[0] ?? null)
									}
									type="file"
								/>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<DialogFooter>
						<Button
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<form.Subscribe selector={(state) => state.isSubmitting}>
							{(isSubmitting) => (
								<Button disabled={isSubmitting} type="submit">
									{isSubmitting
										? editing
											? "Saving..."
											: "Creating..."
										: editing
											? "Save changes"
											: "Create album"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
