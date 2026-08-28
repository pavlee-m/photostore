import { useForm } from "@tanstack/react-form";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { deleteAccount } from "#/api/user.ts";
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
import { toastApiError } from "#/lib/api-error.ts";
import { deleteAccountSchema } from "#/schemas/user.ts";

type DeleteAccountDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted: () => Promise<void> | void;
};

export function DeleteAccountDialog({
	open,
	onOpenChange,
	onDeleted,
}: DeleteAccountDialogProps) {
	const form = useForm({
		defaultValues: {
			password: "",
		},
		validators: {
			onSubmit: deleteAccountSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await deleteAccount(value.password);
				onOpenChange(false);
				await onDeleted();
			} catch (error) {
				toastApiError(error, "Could not delete your account.");
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({ password: "" });
		}
	}, [form, open]);

	return (
		<Dialog
			onOpenChange={(nextOpen) => {
				if (!nextOpen && !form.state.isSubmitting) {
					form.reset({ password: "" });
				}
				onOpenChange(nextOpen);
			}}
			open={open}
		>
			<DialogContent className="border-destructive/30">
				<DialogHeader>
					<div className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
						<TriangleAlert aria-hidden="true" className="size-5" />
					</div>
					<DialogTitle className="text-destructive">Delete account</DialogTitle>
					<DialogDescription>
						This permanently deletes your account and its data. Enter your
						password to confirm.
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
					<FieldGroup>
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
											autoComplete="current-password"
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											type="password"
											value={field.state.value}
										/>
										<FieldDescription>
											Enter your current password to confirm deletion.
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
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<>
									<Button
										disabled={isSubmitting}
										onClick={() => onOpenChange(false)}
										type="button"
										variant="outline"
									>
										Cancel
									</Button>
									<Button
										disabled={!canSubmit || isSubmitting}
										type="submit"
										variant="destructive"
									>
										{isSubmitting ? "Deleting..." : "Delete account"}
									</Button>
								</>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
