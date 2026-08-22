import { Link, useRouterState } from "@tanstack/react-router";
import { FolderOpen, Images, Shield, UserRound, X } from "lucide-react";
import { StorageMeter, UserAvatar } from "#/components/user-avatar.tsx";
import { isAdmin } from "#/lib/roles.ts";
import { cn } from "#/lib/utils.ts";
import type { User } from "#/types/user.ts";

type AppSidebarProps = {
	open: boolean;
	onClose: () => void;
	user: User;
};

const navItems = [
	{ to: "/", label: "Photos", icon: Images },
	{ to: "/albums", label: "Albums", icon: FolderOpen },
] as const;

export function AppSidebar({ open, onClose, user }: AppSidebarProps) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	return (
		<>
			<div
				aria-hidden={!open}
				className={cn(
					"fixed inset-0 z-40 bg-black/35 transition-opacity",
					open ? "opacity-100" : "pointer-events-none opacity-0",
				)}
				onClick={onClose}
			/>
			<aside
				aria-hidden={!open}
				className={cn(
					"island-shell fixed inset-y-3 left-3 z-50 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col rounded-2xl transition-transform duration-200",
					open ? "translate-x-0" : "-translate-x-[120%]",
				)}
			>
				<div className="flex items-center justify-between px-5 pt-5">
					<p className="island-kicker">Photostore</p>
					<button
						aria-label="Close sidebar"
						className="rounded-md p-1 text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)]"
						onClick={onClose}
						type="button"
					>
						<X className="size-4" />
					</button>
				</div>

				<nav className="mt-6 flex flex-1 flex-col gap-1 px-3">
					{navItems.map((item) => {
						const Icon = item.icon;
						const active =
							item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
						return (
							<Link
								className={cn(
									"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)] hover:text-[var(--sea-ink)]",
									active && "bg-[var(--chip-bg)] text-[var(--sea-ink)]",
								)}
								key={item.to}
								onClick={onClose}
								to={item.to}
							>
								<Icon className="size-4" />
								{item.label}
							</Link>
						);
					})}
					{isAdmin(user.role.name) ? (
						<Link
							className={cn(
								"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)] hover:text-[var(--sea-ink)]",
								pathname.startsWith("/admin") &&
									"bg-[var(--chip-bg)] text-[var(--sea-ink)]",
							)}
							onClick={onClose}
							to="/admin"
						>
							<Shield className="size-4" />
							Admin Panel
						</Link>
					) : null}
				</nav>

				<div className="border-t border-[var(--line)] p-3">
					<Link
						className="block rounded-xl p-3 hover:bg-[var(--chip-bg)]"
						onClick={onClose}
						to="/profile"
					>
						<div className="flex items-center gap-3">
							<UserAvatar user={user} />
							<div className="min-w-0">
								<p className="truncate text-sm font-semibold text-[var(--sea-ink)]">
									{user.email}
								</p>
								<p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--sea-ink-soft)]">
									<UserRound className="size-3" />
									View profile
								</p>
							</div>
						</div>
						<div className="mt-3">
							<StorageMeter
								total={user.storage_space}
								used={user.storage_used ?? 0}
							/>
						</div>
					</Link>
				</div>
			</aside>
		</>
	);
}
