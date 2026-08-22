import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { getApiErrorMessage } from "#/lib/api-error.ts";

export function PagePending() {
	return (
		<main className="flex min-h-svh items-center justify-center p-6">
			<output aria-label="Loading page" className="grid w-full max-w-md gap-3">
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-4/5" />
			</output>
		</main>
	);
}

export function PageError({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	return (
		<main className="flex min-h-svh items-center justify-center p-6">
			<section className="island-shell max-w-md rounded-2xl p-8 text-center">
				<Alert className="text-left" variant="destructive">
					<AlertCircle />
					<AlertTitle>Something went wrong</AlertTitle>
					<AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
				</Alert>
				<Button className="mt-4" onClick={reset} variant="outline">
					Try again
				</Button>
			</section>
		</main>
	);
}
