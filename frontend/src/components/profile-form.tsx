import { useForm } from "@tanstack/react-form";
import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getCurrentUser, updateProfile } from "#/api/user.ts";
import { FieldErrors } from "#/components/field-errors.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { UserAvatar } from "#/components/user-avatar.tsx";
import { forgetProfilePicture } from "#/hooks/use-profile-picture.ts";
import { toastApiError } from "#/lib/api-error.ts";
import { editProfileSchema } from "#/schemas/user.ts";
import { useAuthStore } from "#/stores/auth.ts";
import type { User } from "#/types/user.ts";

const ACCEPTED_TYPES =
	"image/jpeg,image/png,image/gif,image/bmp,.jpg,.jpeg,.png,.gif,.bmp";

export function ProfileForm({ user }: { user: User }) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [pictureFile, setPictureFile] = useState<File | null>(null);
	const [previewSrc, setPreviewSrc] = useState<string | null>(null);

	useEffect(() => {
		if (!pictureFile) {
			setPreviewSrc(null);
			return;
		}
		const url = URL.createObjectURL(pictureFile);
		setPreviewSrc(url);
		return () => URL.revokeObjectURL(url);
	}, [pictureFile]);

	const form = useForm({
		defaultValues: {
			email: user.email,
		},
		validators: {
			onSubmit: editProfileSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await updateProfile({
					email: value.email,
					profilePicture: pictureFile,
				});
				forgetProfilePicture(user.id);
				const nextUser = await getCurrentUser();
				if (nextUser) {
					useAuthStore.getState().setUser(nextUser);
					form.reset({ email: nextUser.email });
				}
				setPictureFile(null);
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
				toast.success("Profile updated.");
			} catch (error) {
				toastApiError(error, "Could not update your profile.");
			}
		},
	});

	return (
		<form
			className="grid gap-5"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<div className="flex items-center gap-4">
				<button
					aria-label="Change profile picture"
					className="relative rounded-full"
					onClick={() => fileInputRef.current?.click()}
					type="button"
				>
					<UserAvatar previewSrc={previewSrc} size="lg" user={user} />
					<span className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-[var(--lagoon)] text-white">
						<Camera className="size-4" />
					</span>
				</button>
				<div>
					<p className="text-sm font-medium">Profile picture</p>
					<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
						JPG, PNG, GIF, or BMP. Click the photo to change it.
					</p>
				</div>
				<input
					accept={ACCEPTED_TYPES}
					className="sr-only"
					onChange={(event) => {
						setPictureFile(event.target.files?.[0] ?? null);
					}}
					ref={fileInputRef}
					type="file"
				/>
			</div>
			<form.Field name="email">
				{(field) => (
					<div className="grid gap-2">
						<Label htmlFor={field.name}>Email</Label>
						<Input
							autoComplete="email"
							id={field.name}
							name={field.name}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							type="email"
							value={field.state.value}
						/>
						<FieldErrors errors={field.state.meta.errors} />
					</div>
				)}
			</form.Field>
			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Button disabled={isSubmitting} type="submit">
						{isSubmitting ? "Saving..." : "Save changes"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
