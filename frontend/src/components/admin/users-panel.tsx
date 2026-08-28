import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { deleteUser, listUsers } from "#/api/admin.ts";
import { getCurrentUser } from "#/api/user.ts";
import { CreateUserDialog } from "#/components/admin/create-user-dialog.tsx";
import { EditUserDialog } from "#/components/admin/edit-user-dialog.tsx";
import { ConfirmationDialog } from "#/components/confirmation-dialog.tsx";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "#/components/ui/pagination.tsx";
import { ScrollArea, ScrollBar } from "#/components/ui/scroll-area.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { formatRole, isFounder } from "#/lib/roles.ts";
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
	const [deletingBusy, setDeletingBusy] = useState(false);

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
		setDeletingBusy(true);
		try {
			await deleteUser(deletingUser.id);
			setDeletingUser(null);
			await refreshUsers();
			if (usersQuery.data && usersQuery.data.content.length === 1 && page > 0) {
				onPageChange(page - 1);
			}
		} catch (error) {
			toastApiError(error, "Could not delete the user.");
		} finally {
			setDeletingBusy(false);
		}
	}

	const pageData = usersQuery.data;
	const hasPreviousPage = page > 0;
	const hasNextPage = Boolean(
		pageData && pageData.totalPages > 0 && page + 1 < pageData.totalPages,
	);

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
				<output aria-label="Loading users" className="mt-6 grid gap-3">
					{["one", "two", "three", "four", "five"].map((id) => (
						<Skeleton className="h-11 w-full" key={id} />
					))}
				</output>
			) : usersQuery.isError ? (
				<Alert className="mt-6" variant="destructive">
					<AlertCircle />
					<AlertTitle>Could not load users</AlertTitle>
					<AlertDescription>
						Refresh the page or try again in a moment.
					</AlertDescription>
				</Alert>
			) : (
				<div className="mt-6">
					<ScrollArea className="w-full">
						<div className="min-w-3xl">
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
											<TableCell className="font-medium">
												{user.email}
											</TableCell>
											<TableCell>{formatRole(user.role.name)}</TableCell>
											<TableCell>
												{formatStorageMb(user.storage_space)}
											</TableCell>
											<TableCell>
												{storagePercent(
													user.storage_used ?? 0,
													user.storage_space,
												)}
												%
												<span className="ml-1 text-muted-foreground">
													({formatStorageMb(user.storage_used ?? 0)})
												</span>
											</TableCell>
											<TableCell className="text-right">
												{isFounder(user.role.name) ? null : (
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
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
					<div className="mt-4 flex items-center justify-between text-sm text-[var(--sea-ink-soft)]">
						<p>
							Page {pageData ? pageData.page + 1 : 1} of{" "}
							{pageData && pageData.totalPages > 0 ? pageData.totalPages : 1}
						</p>
						<Pagination className="mx-0 w-auto justify-end">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										aria-disabled={!hasPreviousPage}
										className={
											hasPreviousPage
												? undefined
												: "pointer-events-none opacity-50"
										}
										href={hasPreviousPage ? `?page=${page - 1}` : "#"}
										onClick={(event) => {
											event.preventDefault();
											if (hasPreviousPage) {
												onPageChange(page - 1);
											}
										}}
									/>
								</PaginationItem>
								<PaginationItem>
									<PaginationNext
										aria-disabled={!hasNextPage}
										className={
											hasNextPage ? undefined : "pointer-events-none opacity-50"
										}
										href={hasNextPage ? `?page=${page + 1}` : "#"}
										onClick={(event) => {
											event.preventDefault();
											if (hasNextPage) {
												onPageChange(page + 1);
											}
										}}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
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
			<ConfirmationDialog
				busy={deletingBusy}
				busyLabel="Deleting..."
				confirmLabel="Delete user"
				description={<>Delete {deletingUser?.email}? This cannot be undone.</>}
				onConfirm={handleDelete}
				onOpenChange={(open) => {
					if (!open) {
						setDeletingUser(null);
					}
				}}
				open={deletingUser !== null}
				title="Delete user"
			/>
		</section>
	);
}
