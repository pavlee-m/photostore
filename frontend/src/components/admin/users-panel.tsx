import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { deleteUser, listUsers } from "#/api/admin.ts";
import { getCurrentUser } from "#/api/user.ts";
import { CreateUserDialog } from "#/components/admin/create-user-dialog.tsx";
import { EditUserDialog } from "#/components/admin/edit-user-dialog.tsx";
import { ConfirmationDialog } from "#/components/confirmation-dialog.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
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
		<section>
			<PageHeader
				actions={<Button onClick={() => setCreateOpen(true)}>Add user</Button>}
				description="Create accounts, assign roles, and review storage usage."
				eyebrow="Users"
				title="Manage accounts"
			/>
			<Card className="gap-0 overflow-hidden py-0">
				{usersQuery.isLoading ? (
					<CardContent className="py-6">
						<output aria-label="Loading users" className="grid gap-3">
							{["one", "two", "three", "four", "five"].map((id) => (
								<Skeleton className="h-11 w-full" key={id} />
							))}
						</output>
					</CardContent>
				) : usersQuery.isError ? (
					<CardContent className="py-6">
						<Alert variant="destructive">
							<AlertCircle />
							<AlertTitle>Could not load users</AlertTitle>
							<AlertDescription>
								Refresh the page or try again in a moment.
							</AlertDescription>
						</Alert>
					</CardContent>
				) : (
					<>
						<ScrollArea className="w-full">
							<div className="min-w-[44rem]">
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
												<TableCell className="max-w-64 font-medium">
													<span className="block truncate" title={user.email}>
														{user.email}
													</span>
												</TableCell>
												<TableCell>
													<Badge variant="secondary">
														{formatRole(user.role.name)}
													</Badge>
												</TableCell>
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
														<div className="flex flex-wrap justify-end gap-2">
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
						<div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
							<p aria-live="polite">
								Page {pageData ? pageData.page + 1 : 1} of{" "}
								{pageData && pageData.totalPages > 0 ? pageData.totalPages : 1}
							</p>
							<Pagination
								aria-label="User list pages"
								className="mx-0 w-auto justify-start sm:justify-end"
							>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											aria-disabled={!hasPreviousPage}
											aria-label={`Go to previous page, page ${page}`}
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
											tabIndex={hasPreviousPage ? undefined : -1}
										/>
									</PaginationItem>
									<PaginationItem>
										<PaginationNext
											aria-disabled={!hasNextPage}
											aria-label={`Go to next page, page ${page + 2}`}
											className={
												hasNextPage
													? undefined
													: "pointer-events-none opacity-50"
											}
											href={hasNextPage ? `?page=${page + 1}` : "#"}
											onClick={(event) => {
												event.preventDefault();
												if (hasNextPage) {
													onPageChange(page + 1);
												}
											}}
											tabIndex={hasNextPage ? undefined : -1}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					</>
				)}
			</Card>

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
