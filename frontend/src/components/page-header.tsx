import type { ReactNode } from "react";
import { cn } from "#/lib/utils.ts";

export function PageHeader({
	title,
	description,
	eyebrow,
	actions,
	className,
}: {
	title: string;
	description?: ReactNode;
	eyebrow?: string;
	actions?: ReactNode;
	className?: string;
}) {
	return (
		<header
			className={cn(
				"mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
				className,
			)}
		>
			<div className="min-w-0">
				{eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
				<h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
					{title}
				</h2>
				{description ? (
					<div className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
						{description}
					</div>
				) : null}
			</div>
			{actions ? (
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			) : null}
		</header>
	);
}
