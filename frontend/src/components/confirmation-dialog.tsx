import type { ReactNode } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog.tsx";
import { Button } from "#/components/ui/button.tsx";

export function ConfirmationDialog({
	busy = false,
	busyLabel = "Working...",
	confirmLabel,
	description,
	onConfirm,
	onOpenChange,
	open,
	title,
}: {
	busy?: boolean;
	busyLabel?: string;
	confirmLabel: string;
	description: ReactNode;
	onConfirm: () => Promise<void> | void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	title: string;
}) {
	return (
		<AlertDialog
			onOpenChange={(nextOpen) => {
				if (!busy) {
					onOpenChange(nextOpen);
				}
			}}
			open={open}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div>{description}</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
					<Button
						disabled={busy}
						onClick={() => void onConfirm()}
						variant="destructive"
					>
						{busy ? busyLabel : confirmLabel}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
