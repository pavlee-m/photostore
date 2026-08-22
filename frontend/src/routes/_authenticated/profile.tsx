import { createFileRoute, useRouter } from "@tanstack/react-router";
import { signOut } from "#/api/auth.ts";
import { ProfileForm } from "#/components/profile-form.tsx";
import { Button } from "#/components/ui/button.tsx";
import { StorageMeter } from "#/components/user-avatar.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { formatRole } from "#/lib/roles.ts";
import { useAuthStore } from "#/stores/auth.ts";

export const Route = createFileRoute("/_authenticated/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const router = useRouter();
	const contextUser = Route.useRouteContext().auth.user;
	const storeUser = useAuthStore((state) => state.user);
	const user = storeUser ?? contextUser;

	async function handleSignOut() {
		try {
			await signOut();
			useAuthStore.getState().clear();
			await router.invalidate();
			await router.navigate({ to: "/signin" });
		} catch (error) {
			toastApiError(error, "Could not sign out.");
		}
	}

	if (!user) {
		return null;
	}

	return (
		<main className="page-wrap py-10">
			<section className="island-shell max-w-xl rounded-2xl p-8">
				<p className="island-kicker">Account</p>
				<h2 className="display-title mt-2 text-3xl">Your profile</h2>
				<p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
					{formatRole(user.role.name)}
				</p>
				<div className="mt-6">
					<ProfileForm user={user} />
				</div>
				<div className="mt-6">
					<StorageMeter
						total={user.storage_space}
						used={user.storage_used ?? 0}
					/>
				</div>
				<Button
					className="mt-6"
					onClick={() => void handleSignOut()}
					variant="outline"
				>
					Sign out
				</Button>
			</section>
		</main>
	);
}
