import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { createFounderAndSignIn } from "#/api/session.ts";
import { Button } from "#/components/ui/button.tsx";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { createFounderSchema } from "#/schemas/admin.ts";
import { useAuthStore } from "#/stores/auth.ts";

export function CreateFounderForm() {
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
		},
		validators: {
			onSubmit: createFounderSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const user = await createFounderAndSignIn({
					email: value.email,
					password: value.password,
				});
				useAuthStore.getState().hydrate({
					user,
					founderExists: true,
				});
				await router.invalidate();
				await router.navigate({ to: "/" });
			} catch (error) {
				toastApiError(error, "Could not create the founder account.");
			}
		},
	});

	return (
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
									autoComplete="email"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									type="email"
									value={field.state.value}
								/>
								<FieldDescription>
									This email will be used to sign in as the founder.
								</FieldDescription>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
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
									onChange={(event) => field.handleChange(event.target.value)}
									type="password"
									value={field.state.value}
								/>
								<FieldDescription>Use at least 8 characters.</FieldDescription>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
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
								<FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
								<Input
									aria-invalid={isInvalid}
									autoComplete="new-password"
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									type="password"
									value={field.state.value}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>
			</FieldGroup>

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
			>
				{([canSubmit, isSubmitting]) => (
					<Button type="submit" disabled={!canSubmit || isSubmitting}>
						{isSubmitting ? "Creating founder..." : "Create founder account"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
