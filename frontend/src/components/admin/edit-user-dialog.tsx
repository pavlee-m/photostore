import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { changeUserPassword, updateUser } from "#/api/admin.ts";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { formatStorageMb } from "#/lib/storage.ts";
import { editUserSchema } from "#/schemas/user.ts";
import type { User } from "#/types/user.ts";

type EditUserDialogProps = {
	user: User;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUpdated: () => Promise<void> | void;
};

export function EditUserDialog({
	user,
	open,
	onOpenChange,
	onUpdated,
}: EditUserDialogProps) {
	const form = useForm({
		defaultValues: {
			email: user.email,
			storage_space: String(user.storage_space),
			roleName: (user.role.name === "ROLE_ADMIN"
				? "ROLE_ADMIN"
				: "ROLE_USER") as "ROLE_USER" | "ROLE_ADMIN",
			password: "",
		},
		validators: {
			onSubmit: editUserSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await updateUser(user.id, {
					email: value.email,
					storage_space: Number(value.storage_space),
					roleName: value.roleName,
				});
				if (value.password.length > 0) {
					await changeUserPassword(user.id, value.password);
				}
				onOpenChange(false);
				await onUpdated();
			} catch (error) {
				toastApiError(error, "Could not update the user.");
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				email: user.email,
				storage_space: String(user.storage_space),
				roleName: user.role.name === "ROLE_ADMIN" ? "ROLE_ADMIN" : "ROLE_USER",
				password: "",
			});
		}
	}, [form, open, user]);

	return (
		<Dialog
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					form.reset({
						email: user.email,
						storage_space: String(user.storage_space),
						roleName:
							user.role.name === "ROLE_ADMIN" ? "ROLE_ADMIN" : "ROLE_USER",
						password: "",
					});
				}
				onOpenChange(nextOpen);
			}}
			open={open}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit user</DialogTitle>
					<DialogDescription>
						Update email, role, available storage, or password.
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
					<FieldGroup className="gap-4">
						<form.Field name="email">
							{(field) => {
								const isInvalid =
									(field.state.meta.isTouched ||
										form.state.submissionAttempts > 0) &&
									!field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Email</FieldLabel>
										<Input
											aria-invalid={isInvalid}
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											type="email"
											value={field.state.value}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="storage_space">
							{(field) => {
								const isInvalid =
									(field.state.meta.isTouched ||
										form.state.submissionAttempts > 0) &&
									!field.state.meta.isValid;
								const storageMb = Number(field.state.value);
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Storage (MB)</FieldLabel>
										<Input
											aria-invalid={isInvalid}
											id={field.name}
											min={1}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											type="number"
											value={field.state.value}
										/>
										<FieldDescription>
											{Number.isFinite(storageMb)
												? `${formatStorageMb(storageMb)} available`
												: "Enter the storage available to this user."}
										</FieldDescription>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="roleName">
							{(field) => {
								const isInvalid =
									(field.state.meta.isTouched ||
										form.state.submissionAttempts > 0) &&
									!field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Role</FieldLabel>
										<Select
											name={field.name}
											onValueChange={(value) =>
												field.handleChange(value as "ROLE_USER" | "ROLE_ADMIN")
											}
											value={field.state.value}
										>
											<SelectTrigger
												aria-invalid={isInvalid}
												className="w-full"
												id={field.name}
												onBlur={field.handleBlur}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="ROLE_USER">User</SelectItem>
												<SelectItem value="ROLE_ADMIN">Admin</SelectItem>
											</SelectContent>
										</Select>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="password">
							{(field) => {
								const isInvalid =
									(field.state.meta.isTouched ||
										form.state.submissionAttempts > 0) &&
									!field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>New password</FieldLabel>
										<Input
											aria-invalid={isInvalid}
											autoComplete="new-password"
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="Leave blank to keep current password"
											type="password"
											value={field.state.value}
										/>
										<FieldDescription>
											Leave blank to keep the current password.
										</FieldDescription>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>
					<DialogFooter>
						<Button
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button disabled={!canSubmit || isSubmitting} type="submit">
									{isSubmitting ? "Saving..." : "Save changes"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
