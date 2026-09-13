import { useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	type ButtonHTMLAttributes,
	type ReactNode,
} from "react";
import { toast } from "sonner";
import { ApiError } from "#/api/client.ts";
import { deleteMedia } from "#/api/media.ts";
import { getCurrentUser } from "#/api/user.ts";
import { ConfirmationDialog } from "#/components/confirmation-dialog.tsx";
import { Button } from "#/components/ui/button.tsx";
import { forgetMediaObjectUrl } from "#/hooks/use-media-object-url.ts";
import { toastApiError } from "#/lib/api-error.ts";
import {
	checkmarkKind,
	describePickDelete,
	IDLE,
	isPickGridPath,
	isPicked,
	photoClick,
	pickCount,
	reducePick,
	type CheckmarkKind,
	type MediaId,
	type MediaPickEvent,
	type MediaPickState,
	type PickedIds,
	type PickedPhoto,
	type PointerKind,
} from "#/lib/media-pick.ts";
import { useAuthStore } from "#/stores/auth.ts";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

type MediaPickStore = {
	subscribe: (listener: () => void) => () => void;
	getState: () => MediaPickState;
	dispatch: (event: MediaPickEvent) => void;
	applyLeaveDuringRender: () => void;
};

type MediaPickContextValue = {
	store: MediaPickStore;
	pointer: PointerKind;
};

const MediaPickContext = createContext<MediaPickContextValue | null>(null);

function createMediaPickStore(): MediaPickStore {
	let state: MediaPickState = IDLE;
	const listeners = new Set<() => void>();

	function replace(next: MediaPickState, notify: boolean) {
		if (next === state) {
			return;
		}
		state = next;
		if (notify) {
			for (const listener of listeners) {
				listener();
			}
		}
	}

	return {
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		getState() {
			return state;
		},
		dispatch(event) {
			replace(reducePick(state, event), true);
		},
		applyLeaveDuringRender() {
			// Notify during this render would setState in subscribed tiles.
			replace(reducePick(state, { type: "leave" }), false);
		},
	};
}

function usePointerKind(): PointerKind {
	const [kind, setKind] = useState<PointerKind>(() => {
		if (typeof window === "undefined") {
			return "fine";
		}
		return window.matchMedia(FINE_POINTER).matches ? "fine" : "coarse";
	});

	useEffect(() => {
		const media = window.matchMedia(FINE_POINTER);
		const sync = () => {
			setKind(media.matches ? "fine" : "coarse");
		};
		sync();
		media.addEventListener("change", sync);
		return () => {
			media.removeEventListener("change", sync);
		};
	}, []);

	return kind;
}

function useMediaPickContext(): MediaPickContextValue {
	const value = useContext(MediaPickContext);
	if (!value) {
		throw new Error(
			"useMediaPickTile must be used inside the authenticated app shell",
		);
	}
	return value;
}

export function MediaPickProvider({ children }: { children: ReactNode }) {
	const storeRef = useRef<MediaPickStore | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createMediaPickStore();
	}
	const store = storeRef.current;
	const pointer = usePointerKind();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const prevPathRef = useRef(pathname);
	if (prevPathRef.current !== pathname || !isPickGridPath(pathname)) {
		store.applyLeaveDuringRender();
	}
	prevPathRef.current = pathname;

	const value = useMemo(() => ({ store, pointer }), [pointer, store]);

	return (
		<MediaPickContext.Provider value={value}>
			{children}
		</MediaPickContext.Provider>
	);
}

export type MediaPickTileBinding = {
	readonly picked: boolean;
	readonly checkmark: CheckmarkKind;
	readonly tileProps: { "data-picked"?: "" };
	readonly photoButtonProps: Pick<
		ButtonHTMLAttributes<HTMLButtonElement>,
		"aria-label" | "aria-pressed" | "onClick" | "type"
	>;
	readonly pickButtonProps: Pick<
		ButtonHTMLAttributes<HTMLButtonElement>,
		"aria-label" | "aria-pressed" | "onClick" | "type"
	>;
};

export function useMediaPickTile({
	id,
	name,
	onOpen,
}: {
	id: MediaId;
	name: string;
	onOpen: () => void;
}): MediaPickTileBinding {
	const { store, pointer } = useMediaPickContext();
	const picked = useSyncExternalStore(
		store.subscribe,
		() => isPicked(store.getState(), id),
		() => false,
	);
	const checkmark = useSyncExternalStore(
		store.subscribe,
		() => checkmarkKind(store.getState(), id, pointer),
		() => checkmarkKind(IDLE, id, "fine"),
	);
	const click = useSyncExternalStore(
		store.subscribe,
		() => photoClick(store.getState(), id, pointer),
		() => photoClick(IDLE, id, "fine"),
	);
	const photo: PickedPhoto = { id, name };

	return {
		picked,
		checkmark,
		tileProps: {
			"data-picked": picked ? "" : undefined,
		},
		photoButtonProps: {
			type: "button",
			"aria-label": click === "toggle" ? `Pick ${name}` : `Open ${name}`,
			"aria-pressed": click === "toggle" ? picked : undefined,
			onClick() {
				const intent = photoClick(store.getState(), id, pointer);
				if (intent === "open") {
					onOpen();
					return;
				}
				if (intent === "reveal") {
					store.dispatch({ type: "reveal", id });
					return;
				}
				store.dispatch({ type: "toggle", photo });
			},
		},
		pickButtonProps: {
			type: "button",
			"aria-label": `Pick ${name}`,
			"aria-pressed": picked,
			onClick(event) {
				event.stopPropagation();
				store.dispatch({ type: "toggle", photo });
			},
		},
	};
}

function isAlreadyGone(error: unknown): boolean {
	if (!(error instanceof ApiError)) {
		return false;
	}
	return (
		error.status === 404 ||
		error.code === "MEDIA_NOT_FOUND" ||
		error.code === "NOT_FOUND"
	);
}

export function MediaPickChrome() {
	const queryClient = useQueryClient();
	const { store } = useMediaPickContext();
	const state = useSyncExternalStore(
		store.subscribe,
		store.getState,
		() => IDLE,
	);
	const [pending, setPending] = useState<PickedIds | null>(null);
	const [busy, setBusy] = useState(false);

	if (state.phase !== "picking" && pending === null) {
		return null;
	}

	const pickingIds = state.phase === "picking" ? state.ids : null;
	const count = pickCount(state);
	const copy = pending
		? describePickDelete(pending)
		: {
				title: "Delete photo",
				confirmLabel: "Delete photo",
				description: "",
			};

	async function confirm() {
		if (!pending) {
			return;
		}
		setBusy(true);
		const snapshot = [...pending.values()];
		const total = snapshot.length;
		let deleted = 0;
		let failed = 0;
		let lastError: unknown;
		for (const photo of snapshot) {
			try {
				await deleteMedia(photo.id);
				forgetMediaObjectUrl(photo.id);
				store.dispatch({ type: "drop", ids: [photo.id] });
				deleted += 1;
			} catch (error) {
				if (isAlreadyGone(error)) {
					forgetMediaObjectUrl(photo.id);
					store.dispatch({ type: "drop", ids: [photo.id] });
					deleted += 1;
					continue;
				}
				failed += 1;
				lastError = error;
			}
		}
		if (deleted > 0) {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["media-list"] }),
				queryClient.invalidateQueries({ queryKey: ["album-media"] }),
			]);
			const user = await getCurrentUser();
			if (user) {
				useAuthStore.getState().setUser(user);
			}
		}
		if (failed === 0) {
			toast.success(
				deleted === 1 ? "Photo deleted." : `${deleted} photos deleted.`,
			);
		} else if (deleted === 0) {
			toastApiError(lastError, "Could not delete these photos.");
		} else {
			toast.error(
				`Deleted ${deleted} of ${total}. ${failed} could not be deleted.`,
			);
		}
		setBusy(false);
		setPending(null);
	}

	return (
		<>
			{pickingIds ? (
				<>
					<Button
						aria-label="Cancel"
						disabled={busy}
						onClick={() => {
							store.dispatch({ type: "leave" });
							setPending(null);
						}}
						size="sm"
						variant="ghost"
					>
						Cancel
					</Button>
					<Button
						aria-label={`Delete ${count}`}
						disabled={busy}
						onClick={() => {
							setPending(pickingIds);
						}}
						size="sm"
						variant="destructive"
					>
						<Trash2 />
						Delete {count}
					</Button>
				</>
			) : null}
			<ConfirmationDialog
				busy={busy}
				busyLabel="Deleting..."
				confirmLabel={copy.confirmLabel}
				description={copy.description}
				onConfirm={confirm}
				onOpenChange={(open) => {
					if (!open) {
						setPending(null);
					}
				}}
				open={pending !== null}
				title={copy.title}
			/>
		</>
	);
}
