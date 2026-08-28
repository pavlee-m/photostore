import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";

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
		<main className="flex min-h-svh items-center justify-center bg-muted/30 p-4 sm:p-6">
			<Card className="w-full max-w-md shadow-md">
				<CardHeader>
					<p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
						{kicker}
					</p>
					<CardTitle>
						<h1 className="text-2xl tracking-tight sm:text-3xl">{title}</h1>
					</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		</main>
	);
}
