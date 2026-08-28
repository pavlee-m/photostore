import { useState } from "react";
import { deleteAccount } from "#/api/user.ts";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toastApiError } from "#/lib/api-error.ts";

type DeleteAccountDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted: () => Promise<void> | void;
};

export function DeleteAccountDialog({
	open,
	onOpenChange,
	onDeleted,
}: DeleteAccountDialogProps) {
	const [password, setPassword] = useState("");
	const [busy, setBusy] = useState(false);

	async function handleDelete() {
		setBusy(true);
		try {
			await deleteAccount(password);
			setPassword("");
			onOpenChange(false);
			await onDeleted();
		} catch (error) {
			toastApiError(error, "Could not delete your account.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog
			onOpenChange={(nextOpen) => {
				if (!nextOpen && !busy) {
					setPassword("");
				}
				onOpenChange(nextOpen);
			}}
			open={open}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete account</DialogTitle>
					<DialogDescription>
						This permanently deletes your account and its data. Enter your
						password to confirm.
					</DialogDescription>
				</DialogHeader>
				<form
					className="grid gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						void handleDelete();
					}}
				>
					<div className="grid gap-2">
						<Label htmlFor="delete-account-password">Password</Label>
						<Input
							autoComplete="current-password"
							id="delete-account-password"
							onChange={(event) => setPassword(event.target.value)}
							required
							type="password"
							value={password}
						/>
					</div>
					<DialogFooter>
						<Button
							disabled={busy}
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={busy || password.length === 0}
							type="submit"
							variant="destructive"
						>
							{busy ? "Deleting..." : "Delete account"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
