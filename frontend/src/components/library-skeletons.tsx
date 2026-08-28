import { Card } from "#/components/ui/card.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { cn } from "#/lib/utils.ts";

const PLACEHOLDER_IDS = [
	"01",
	"02",
	"03",
	"04",
	"05",
	"06",
	"07",
	"08",
	"09",
	"10",
	"11",
	"12",
	"13",
	"14",
	"15",
	"16",
	"17",
	"18",
	"19",
	"20",
] as const;

export function MediaGridSkeleton({
	className,
	count = 14,
}: {
	className?: string;
	count?: number;
}) {
	return (
		<output
			aria-label="Loading photos"
			className={cn(
				"grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7",
				className,
			)}
		>
			{PLACEHOLDER_IDS.slice(0, count).map((id) => (
				<Skeleton className="aspect-square rounded-lg" key={`media-${id}`} />
			))}
		</output>
	);
}

export function AlbumGridSkeleton({ count = 10 }: { count?: number }) {
	return (
		<output
			aria-label="Loading albums"
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{PLACEHOLDER_IDS.slice(0, count).map((id) => (
				<Card className="gap-0 overflow-hidden p-0" key={`album-${id}`}>
					<Skeleton className="aspect-4/3 rounded-none" />
					<div className="grid gap-2 p-4">
						<Skeleton className="h-5 w-2/3" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-4/5" />
					</div>
				</Card>
			))}
		</output>
	);
}
