import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthShell } from "#/components/auth-shell.tsx";
import { SignInForm } from "#/components/sign-in-form.tsx";
import { safeInternalPath } from "#/lib/form.ts";

type SignInSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/signin")({
	validateSearch: (search: Record<string, unknown>): SignInSearch => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: ({ context, search }) => {
		if (!context.auth.founderExists) {
			throw redirect({ to: "/setup" });
		}
		if (context.auth.user) {
			throw redirect({ href: safeInternalPath(search.redirect) });
		}
	},
	component: SignInPage,
});

function SignInPage() {
	const { redirect: redirectTo } = Route.useSearch();

	return (
		<AuthShell
			kicker="Welcome back"
			title="Sign in"
			description="Accounts are created by the founder or an admin. Use the credentials you were given to continue."
		>
			<SignInForm redirectTo={redirectTo} />
		</AuthShell>
	);
}
