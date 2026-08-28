import type { ComponentProps } from "react";
import { cn } from "#/lib/utils.ts";

function Progress({
	className,
	value = 0,
	...props
}: ComponentProps<"div"> & { value?: number }) {
	const percent = Math.min(100, Math.max(0, value));

	return (
		<div
			aria-valuemax={100}
			aria-valuemin={0}
			aria-valuenow={percent}
			className={cn(
				"relative h-1.5 w-full overflow-hidden rounded-full bg-secondary",
				className,
			)}
			data-slot="progress"
			role="progressbar"
			{...props}
		>
			<div
				className="h-full rounded-full bg-primary transition-[width]"
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
}

export { Progress };
