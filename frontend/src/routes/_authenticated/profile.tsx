import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { signOut } from "#/api/auth.ts";
import { DeleteAccountDialog } from "#/components/delete-account-dialog.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { ProfileForm } from "#/components/profile-form.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Separator } from "#/components/ui/separator.tsx";
import { StorageMeter } from "#/components/user-avatar.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { formatRole, isFounder } from "#/lib/roles.ts";
import { useAuthStore } from "#/stores/auth.ts";

export const Route = createFileRoute("/_authenticated/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const router = useRouter();
	const [deleteOpen, setDeleteOpen] = useState(false);
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
		<main className="page-wrap py-8 sm:py-10">
			<PageHeader
				description="Manage your account details, storage, and session."
				eyebrow="Account"
				title="Your profile"
			/>
			<Card className="max-w-xl">
				<CardHeader>
					<div className="flex items-center justify-between gap-3">
						<CardTitle>Profile details</CardTitle>
						<Badge variant="secondary">{formatRole(user.role.name)}</Badge>
					</div>
					<CardDescription>
						Update the information associated with your account.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-6">
					<ProfileForm user={user} />
					<StorageMeter
						total={user.storage_space}
						used={user.storage_used ?? 0}
					/>
				</CardContent>
				<CardFooter>
					<Button onClick={() => void handleSignOut()} variant="outline">
						Sign out
					</Button>
				</CardFooter>
			</Card>
			{isFounder(user.role.name) ? null : (
				<Card className="mt-6 max-w-xl border-destructive/30">
					<CardHeader>
						<CardTitle className="text-destructive">Danger zone</CardTitle>
						<CardDescription>
							Permanently delete your account and all of its data.
						</CardDescription>
					</CardHeader>
					<Separator />
					<CardFooter>
						<Button onClick={() => setDeleteOpen(true)} variant="destructive">
							Delete account
						</Button>
					</CardFooter>
				</Card>
			)}
			{isFounder(user.role.name) ? null : (
				<DeleteAccountDialog
					onDeleted={async () => {
						useAuthStore.getState().clear();
						await router.invalidate();
						await router.navigate({ to: "/signin" });
					}}
					onOpenChange={setDeleteOpen}
					open={deleteOpen}
				/>
			)}
		</main>
	);
}
