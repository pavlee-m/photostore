import { fieldErrorMessage } from "#/lib/form.ts";

export function FieldErrors({ errors }: { errors: unknown[] }) {
	const message = fieldErrorMessage(errors);
	if (!message) {
		return null;
	}

	return (
		<p className="text-destructive text-sm" role="alert">
			{message}
		</p>
	);
}
