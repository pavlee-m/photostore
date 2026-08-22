import { useForm } from "@tanstack/react-form";
import { changeUserPassword, updateUser } from "#/api/admin.ts";
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
			storage_space: user.storage_space,
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
					storage_space: value.storage_space,
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

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
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
					<form.Field name="email">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>Email</Label>
								<Input
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
					<form.Field name="storage_space">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>Storage (MB)</Label>
								<Input
									id={field.name}
									min={1}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) =>
										field.handleChange(event.target.valueAsNumber)
									}
									type="number"
									value={field.state.value}
								/>
								<p className="text-xs text-muted-foreground">
									{formatStorageMb(field.state.value)} available
								</p>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<form.Field name="roleName">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>Role</Label>
								<Select
									onValueChange={(value) =>
										field.handleChange(value as "ROLE_USER" | "ROLE_ADMIN")
									}
									value={field.state.value}
								>
									<SelectTrigger className="w-full" id={field.name}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ROLE_USER">User</SelectItem>
										<SelectItem value="ROLE_ADMIN">Admin</SelectItem>
									</SelectContent>
								</Select>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<form.Field name="password">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>New password</Label>
								<Input
									autoComplete="new-password"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Leave blank to keep current password"
									type="password"
									value={field.state.value}
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
