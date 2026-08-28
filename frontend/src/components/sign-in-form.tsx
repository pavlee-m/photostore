import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { signIn } from "#/api/auth.ts";
import { ApiError } from "#/api/client.ts";
import { getCurrentUser } from "#/api/user.ts";
import { FieldErrors } from "#/components/field-errors.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
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
			<form.Field name="email">
				{(field) => (
					<div className="grid gap-2">
						<Label htmlFor={field.name}>Email</Label>
						<Input
							id={field.name}
							name={field.name}
							type="email"
							autoComplete="email"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							aria-invalid={field.state.meta.errors.length > 0}
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
							id={field.name}
							name={field.name}
							type="password"
							autoComplete="current-password"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							aria-invalid={field.state.meta.errors.length > 0}
						/>
						<FieldErrors errors={field.state.meta.errors} />
					</div>
				)}
			</form.Field>

			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Signing in..." : "Sign in"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
