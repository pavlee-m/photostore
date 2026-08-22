import { getApiErrorMessage } from "#/lib/api-error.ts";

export function PagePending() {
	return (
		<main className="flex min-h-svh items-center justify-center p-6">
			<p className="text-sm text-[var(--sea-ink-soft)]">Loading...</p>
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
				<h1 className="display-title text-2xl">Something went wrong</h1>
				<p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
					{getApiErrorMessage(error)}
				</p>
				<button
					className="mt-4 text-sm underline"
					onClick={reset}
					type="button"
				>
					Try again
				</button>
			</section>
		</main>
	);
}
