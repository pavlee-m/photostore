import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { signIn } from "#/api/auth.ts";
import { ApiError } from "#/api/client.ts";
import { getCurrentUser } from "#/api/user.ts";
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
import { safeInternalPath } from "#/lib/form.ts";
import { signInSchema } from "#/schemas/auth.ts";
import { useAuthStore } from "#/stores/auth.ts";

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: signInSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await signIn(value);
				const user = await getCurrentUser();
				if (!user) {
					throw new ApiError(
						401,
						"Invalid email or password",
						"INVALID_CREDENTIALS",
					);
				}
				useAuthStore.getState().hydrate({
					user,
					founderExists: true,
				});
				await router.invalidate();
				await router.navigate({ href: safeInternalPath(redirectTo) });
			} catch (error) {
				toastApiError(error, "Could not sign in.");
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
									id={field.name}
									name={field.name}
									type="email"
									autoComplete="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldDescription>
									Use the email address associated with your account.
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
									id={field.name}
									name={field.name}
									type="password"
									autoComplete="current-password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
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
						{isSubmitting ? "Signing in..." : "Sign in"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
