import type { ReactNode } from "react";

type AuthShellProps = {
	kicker: string;
	title: string;
	description: string;
	children: ReactNode;
};

export function AuthShell({
	kicker,
	title,
	description,
	children,
}: AuthShellProps) {
	return (
		<main className="flex min-h-svh items-center justify-center p-6">
			<section className="island-shell rise-in w-full max-w-md rounded-2xl p-8">
				<p className="island-kicker">{kicker}</p>
				<h1 className="display-title mt-3 text-3xl font-semibold text-[var(--sea-ink)]">
					{title}
				</h1>
				<p className="mt-2 text-sm text-[var(--sea-ink-soft)]">{description}</p>
				<div className="mt-6">{children}</div>
			</section>
		</main>
	);
}
