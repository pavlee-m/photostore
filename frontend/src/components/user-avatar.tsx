import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "#/components/ui/avatar.tsx";
import { Progress } from "#/components/ui/progress.tsx";
import { useProfilePictureUrl } from "#/hooks/use-profile-picture.ts";
import { formatStorageMb, storagePercent } from "#/lib/storage.ts";
import type { User } from "#/types/user.ts";

function initialsFor(email: string) {
	const local = email.split("@")[0] ?? email;
	return local.slice(0, 2).toUpperCase();
}

const sizes = {
	sm: "size-8 text-xs",
	md: "size-10 text-sm",
	lg: "size-24 text-2xl",
} as const;

export function UserAvatar({
	previewSrc,
	size = "md",
	user,
}: {
	user: Pick<User, "id" | "email" | "profile_picture_url">;
	previewSrc?: string | null;
	size?: "sm" | "md" | "lg";
}) {
	const fetchedSrc = useProfilePictureUrl(user.id, user.profile_picture_url);
	const src = previewSrc || fetchedSrc;
	const dimension = sizes[size];

	return (
		<Avatar className={dimension}>
			{src ? <AvatarImage alt="" className="object-cover" src={src} /> : null}
			<AvatarFallback className="bg-[color-mix(in_oklab,var(--lagoon)_28%,var(--foam))] font-semibold text-[var(--sea-ink)]">
				{initialsFor(user.email)}
			</AvatarFallback>
		</Avatar>
	);
}

export function StorageMeter({ used, total }: { used: number; total: number }) {
	const percent = storagePercent(used, total);

	return (
		<div className="grid gap-1.5">
			<Progress value={percent} />
			<p className="text-xs text-[var(--sea-ink-soft)]">
				{percent}% used · {formatStorageMb(used)} of {formatStorageMb(total)}
			</p>
		</div>
	);
}
