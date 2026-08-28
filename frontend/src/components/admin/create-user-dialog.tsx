import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { createUser } from "#/api/admin.ts";
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
import { createUserSchema } from "#/schemas/user.ts";

type CreateUserDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated: () => Promise<void> | void;
};

export function CreateUserDialog({
	open,
	onOpenChange,
	onCreated,
}: CreateUserDialogProps) {
	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
			storage_space: "25600",
			roleName: "ROLE_USER" as "ROLE_USER" | "ROLE_ADMIN",
		},
		validators: {
			onSubmit: createUserSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await createUser({
					email: value.email,
					password: value.password,
					storage_space: Number(value.storage_space),
					roleName: value.roleName,
				});
				onOpenChange(false);
				await onCreated();
			} catch (error) {
				toastApiError(error, "Could not create the user.");
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				email: "",
				password: "",
				confirmPassword: "",
				storage_space: "25600",
				roleName: "ROLE_USER",
			});
		}
	}, [form, open]);

	return (
		<Dialog
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					form.reset();
				}
				onOpenChange(nextOpen);
			}}
			open={open}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add user</DialogTitle>
					<DialogDescription>
						Create a regular user or admin account.
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
											autoComplete="off"
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
						<form.Field name="password">
							{(field) => {
								const isInvalid =
									(field.state.meta.isTouched ||
										form.state.submissionAttempts > 0) &&
									!field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Password</FieldLabel>
										<Input
											aria-invalid={isInvalid}
											autoComplete="new-password"
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											type="password"
											value={field.state.value}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="confirmPassword">
							{(field) => {
								const isInvalid =
									(field.state.meta.isTouched ||
										form.state.submissionAttempts > 0) &&
									!field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Confirm password
										</FieldLabel>
										<Input
											aria-invalid={isInvalid}
											autoComplete="new-password"
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											type="password"
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
									{isSubmitting ? "Creating..." : "Create user"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
