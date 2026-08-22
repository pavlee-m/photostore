import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthShell } from "#/components/auth-shell.tsx";
import { CreateAdminForm } from "#/components/create-admin-form.tsx";

export const Route = createFileRoute("/setup")({
	beforeLoad: ({ context }) => {
		if (context.auth.adminExists) {
			throw redirect({ to: context.auth.user ? "/" : "/signin" });
		}
	},
	component: SetupPage,
});

function SetupPage() {
	return (
		<AuthShell
			kicker="First-time setup"
			title="Create the admin account"
			description="No admin exists yet. Create one to unlock the rest of Photostore. Additional users can be created later by an admin."
		>
			<CreateAdminForm />
		</AuthShell>
	);
}
