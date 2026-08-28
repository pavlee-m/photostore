import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Aperture, FolderOpen, Images, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { signOut } from "#/api/auth.ts";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "#/components/ui/sidebar.tsx";
import { StorageMeter, UserAvatar } from "#/components/user-avatar.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { canAccessAdmin } from "#/lib/roles.ts";
import { useAuthStore } from "#/stores/auth.ts";
import type { User } from "#/types/user.ts";

const navItems = [
	{ to: "/", label: "Photos", icon: Images },
	{ to: "/albums", label: "Albums", icon: FolderOpen },
] as const;

export function AppSidebar({ user }: { user: User }) {
	const router = useRouter();
	const { setOpenMobile } = useSidebar();
	const [signingOut, setSigningOut] = useState(false);
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	async function handleSignOut() {
		setSigningOut(true);
		try {
			await signOut();
			useAuthStore.getState().clear();
			setOpenMobile(false);
			await router.invalidate();
			await router.navigate({ to: "/signin" });
		} catch (error) {
			toastApiError(error, "Could not sign out.");
		} finally {
			setSigningOut(false);
		}
	}

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-b p-2">
				<div className="flex h-8 items-center gap-2">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
						<Aperture className="size-4" />
					</div>
					<div className="min-w-0 group-data-[collapsible=icon]:hidden">
						<p className="truncate text-sm font-semibold tracking-tight">
							Photostore
						</p>
						<p className="truncate text-xs text-muted-foreground">
							Your private library
						</p>
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Library</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const Icon = item.icon;
								const active =
									item.to === "/"
										? pathname === "/"
										: pathname.startsWith(item.to);
								return (
									<SidebarMenuItem key={item.to}>
										<SidebarMenuButton
											asChild
											isActive={active}
											tooltip={item.label}
										>
											<Link
												aria-current={active ? "page" : undefined}
												onClick={() => setOpenMobile(false)}
												to={item.to}
											>
												<Icon />
												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
							{canAccessAdmin(user.role.name) ? (
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={pathname.startsWith("/admin")}
										tooltip="Admin"
									>
										<Link
											aria-current={
												pathname.startsWith("/admin") ? "page" : undefined
											}
											onClick={() => setOpenMobile(false)}
											to="/admin"
										>
											<Shield />
											<span>Admin</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							) : null}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="border-t p-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={pathname === "/profile"}
							size="lg"
							tooltip="Profile"
						>
							<Link
								aria-current={pathname === "/profile" ? "page" : undefined}
								onClick={() => setOpenMobile(false)}
								to="/profile"
							>
								<UserAvatar size="sm" user={user} />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{user.email}</p>
									<StorageMeter
										total={user.storage_space}
										used={user.storage_used ?? 0}
									/>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							disabled={signingOut}
							onClick={() => void handleSignOut()}
							tooltip="Sign out"
						>
							<LogOut />
							<span>{signingOut ? "Signing out..." : "Sign out"}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
