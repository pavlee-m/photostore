import { useForm } from "@tanstack/react-form";
import { createUser } from "#/api/admin.ts";
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
			storage_space: 25600,
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
					storage_space: value.storage_space,
					roleName: value.roleName,
				});
				form.reset();
				onOpenChange(false);
				await onCreated();
			} catch (error) {
				toastApiError(error, "Could not create the user.");
			}
		},
	});

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add user</DialogTitle>
					<DialogDescription>
						Create an account. Only admins can add users.
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
									autoComplete="off"
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
					<form.Field name="password">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>Password</Label>
								<Input
									autoComplete="new-password"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									type="password"
									value={field.state.value}
								/>
								<FieldErrors errors={field.state.meta.errors} />
							</div>
						)}
					</form.Field>
					<form.Field name="confirmPassword">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>Confirm password</Label>
								<Input
									autoComplete="new-password"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									type="password"
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
