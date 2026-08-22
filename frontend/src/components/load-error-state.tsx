import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";

export function LoadErrorState({
	message,
	title = "Could not load this page",
}: {
	message: string;
	title?: string;
}) {
	return (
		<main className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-6">
			<Alert className="max-w-md" variant="destructive">
				<AlertCircle />
				<AlertTitle>{title}</AlertTitle>
				<AlertDescription>{message}</AlertDescription>
			</Alert>
		</main>
	);
}
