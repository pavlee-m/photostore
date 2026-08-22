import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteUser, listUsers } from "#/api/admin.ts";
import { getCurrentUser } from "#/api/user.ts";
import { CreateUserDialog } from "#/components/admin/create-user-dialog.tsx";
import { EditUserDialog } from "#/components/admin/edit-user-dialog.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { formatRole } from "#/lib/roles.ts";
import { formatStorageMb, storagePercent } from "#/lib/storage.ts";
import { useAuthStore } from "#/stores/auth.ts";
import type { User } from "#/types/user.ts";

const PAGE_SIZE = 10;

export function UsersPanel({
	page,
	onPageChange,
	currentUserId,
}: {
	page: number;
	onPageChange: (page: number) => void;
	currentUserId: number;
}) {
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [deletingUser, setDeletingUser] = useState<User | null>(null);

	const usersQuery = useQuery({
		queryKey: ["admin-users", page],
		queryFn: () => listUsers(page, PAGE_SIZE),
	});

	async function refreshUsers() {
		await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
		const me = await getCurrentUser();
		if (me) {
			useAuthStore.getState().setUser(me);
		}
	}

	async function handleDelete() {
		if (!deletingUser) {
			return;
		}
		try {
			await deleteUser(deletingUser.id);
			setDeletingUser(null);
			await refreshUsers();
			if (usersQuery.data && usersQuery.data.content.length === 1 && page > 0) {
				onPageChange(page - 1);
			}
		} catch (error) {
			toastApiError(error, "Could not delete the user.");
		}
	}

	const pageData = usersQuery.data;

	return (
		<section className="island-shell rounded-2xl p-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="island-kicker">Users</p>
					<h2 className="display-title mt-1 text-2xl">Manage accounts</h2>
				</div>
				<Button onClick={() => setCreateOpen(true)}>Add user</Button>
			</div>

			{usersQuery.isLoading ? (
				<p className="mt-6 text-sm text-[var(--sea-ink-soft)]">
					Loading users...
				</p>
			) : usersQuery.isError ? (
				<p className="mt-6 text-destructive text-sm">Could not load users.</p>
			) : (
				<div className="mt-6">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Storage</TableHead>
								<TableHead>Used</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pageData?.content.map((user) => (
								<TableRow key={user.id}>
									<TableCell className="font-medium">{user.email}</TableCell>
									<TableCell>{formatRole(user.role.name)}</TableCell>
									<TableCell>{formatStorageMb(user.storage_space)}</TableCell>
									<TableCell>
										{storagePercent(user.storage_used ?? 0, user.storage_space)}
										%
										<span className="ml-1 text-muted-foreground">
											({formatStorageMb(user.storage_used ?? 0)})
										</span>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												onClick={() => setEditingUser(user)}
												size="sm"
												variant="outline"
											>
												Edit
											</Button>
											<Button
												disabled={user.id === currentUserId}
												onClick={() => setDeletingUser(user)}
												size="sm"
												variant="destructive"
											>
												Delete
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<div className="mt-4 flex items-center justify-between text-sm text-[var(--sea-ink-soft)]">
						<p>
							Page {pageData ? pageData.page + 1 : 1} of{" "}
							{pageData && pageData.totalPages > 0 ? pageData.totalPages : 1}
						</p>
						<div className="flex gap-2">
							<Button
								disabled={page <= 0}
								onClick={() => onPageChange(page - 1)}
								size="sm"
								variant="outline"
							>
								Previous
							</Button>
							<Button
								disabled={
									!pageData ||
									page + 1 >= pageData.totalPages ||
									pageData.totalPages === 0
								}
								onClick={() => onPageChange(page + 1)}
								size="sm"
								variant="outline"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			)}

			<CreateUserDialog
				onCreated={refreshUsers}
				onOpenChange={setCreateOpen}
				open={createOpen}
			/>
			{editingUser ? (
				<EditUserDialog
					onOpenChange={(open) => {
						if (!open) {
							setEditingUser(null);
						}
					}}
					onUpdated={refreshUsers}
					open
					user={editingUser}
				/>
			) : null}
			<Dialog
				onOpenChange={(open) => {
					if (!open) {
						setDeletingUser(null);
					}
				}}
				open={deletingUser !== null}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete user</DialogTitle>
						<DialogDescription>
							Delete {deletingUser?.email}? This cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							onClick={() => setDeletingUser(null)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button onClick={() => void handleDelete()} variant="destructive">
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}
