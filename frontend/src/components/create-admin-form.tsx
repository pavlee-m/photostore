import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { createFounderAndSignIn } from "#/api/session.ts";
import { FieldErrors } from "#/components/field-errors.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
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
							autoComplete="new-password"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
							aria-invalid={field.state.meta.errors.length > 0}
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
							id={field.name}
							name={field.name}
							type="password"
							autoComplete="new-password"
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
						{isSubmitting ? "Creating founder..." : "Create founder account"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
