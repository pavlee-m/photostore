import { createFileRoute, redirect } from "@tanstack/react-router";
import { UsersPanel } from "#/components/admin/users-panel.tsx";
import { isAdmin } from "#/lib/roles.ts";

type AdminSearch = {
	page?: number;
};

export const Route = createFileRoute("/_authenticated/admin")({
	validateSearch: (search: Record<string, unknown>): AdminSearch => {
		const page = Number(search.page);
		if (!Number.isInteger(page) || page < 0) {
			return {};
		}
		return { page };
	},
	beforeLoad: ({ context }) => {
		if (!isAdmin(context.auth.user?.role.name)) {
			throw redirect({ to: "/" });
		}
	},
	component: AdminPage,
});

function AdminPage() {
	const { page = 0 } = Route.useSearch();
	const navigate = Route.useNavigate();
	const currentUser = Route.useRouteContext().auth.user;

	return (
		<main className="page-wrap py-10">
			<UsersPanel
				currentUserId={currentUser?.id ?? 0}
				onPageChange={(nextPage) => {
					void navigate({
						to: "/admin",
						search: nextPage === 0 ? {} : { page: nextPage },
					});
				}}
				page={page}
			/>
		</main>
	);
}
