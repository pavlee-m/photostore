import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthShell } from "#/components/auth-shell.tsx";
import { CreateFounderForm } from "#/components/create-admin-form.tsx";

export const Route = createFileRoute("/setup")({
	beforeLoad: ({ context }) => {
		if (context.auth.founderExists) {
			throw redirect({ to: context.auth.user ? "/" : "/signin" });
		}
	},
	component: SetupPage,
});

function SetupPage() {
	return (
		<AuthShell
			kicker="First-time setup"
			title="Create the founder account"
			description="Create the permanent founder account to unlock Photostore. The founder can create admins and regular users later."
		>
			<CreateFounderForm />
		</AuthShell>
	);
}
