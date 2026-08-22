import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "#/components/app-shell.tsx";
import { useAuthStore } from "#/stores/auth.ts";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		if (!context.auth.adminExists) {
			throw redirect({ to: "/setup" });
		}
		if (!context.auth.user) {
			throw redirect({
				to: "/signin",
				search: {
					redirect: location.pathname === "/" ? undefined : location.pathname,
				},
			});
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	const contextUser = Route.useRouteContext().auth.user;
	const storeUser = useAuthStore((state) => state.user);
	const user = storeUser ?? contextUser;

	if (!user) {
		return <Outlet />;
	}

	return <AppShell user={user} />;
}
