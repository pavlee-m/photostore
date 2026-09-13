export type MediaId = number;

export type PickedPhoto = {
	readonly id: MediaId;
	readonly name: string;
};

export type PickedIds = ReadonlyMap<MediaId, PickedPhoto> & {
	readonly __picked: true;
};

export type PointerKind = "fine" | "coarse";

export type MediaPickState =
	| { readonly phase: "idle" }
	| { readonly phase: "armed"; readonly revealed: MediaId }
	| { readonly phase: "picking"; readonly ids: PickedIds };

export type MediaPickEvent =
	| { readonly type: "reveal"; readonly id: MediaId }
	| { readonly type: "toggle"; readonly photo: PickedPhoto }
	| { readonly type: "drop"; readonly ids: readonly MediaId[] }
	| { readonly type: "leave" };

export type PhotoClick = "open" | "reveal" | "toggle";

export type CheckmarkKind = "hover" | "revealed" | "on" | "absent";

export const IDLE: MediaPickState = { phase: "idle" };

export function pickedIds(photos: Iterable<PickedPhoto>): PickedIds | null {
	const map = new Map<MediaId, PickedPhoto>();
	for (const photo of photos) {
		map.set(photo.id, photo);
	}
	if (map.size === 0) {
		return null;
	}
	return map as PickedIds;
}

export function reducePick(
	state: MediaPickState,
	event: MediaPickEvent,
): MediaPickState {
	switch (event.type) {
		case "leave":
			return state.phase === "idle" ? state : IDLE;
		case "reveal":
			if (state.phase === "picking") {
				return state;
			}
			if (state.phase === "armed" && state.revealed === event.id) {
				return state;
			}
			return { phase: "armed", revealed: event.id };
		case "toggle": {
			if (state.phase !== "picking") {
				const ids = pickedIds([event.photo]);
				return ids ? { phase: "picking", ids } : IDLE;
			}
			const next = new Map(state.ids);
			if (next.has(event.photo.id)) {
				next.delete(event.photo.id);
			} else {
				next.set(event.photo.id, event.photo);
			}
			const ids = pickedIds(next.values());
			return ids ? { phase: "picking", ids } : IDLE;
		}
		case "drop": {
			if (state.phase !== "picking") {
				return state;
			}
			const next = new Map(state.ids);
			let changed = false;
			for (const id of event.ids) {
				if (next.delete(id)) {
					changed = true;
				}
			}
			if (!changed) {
				return state;
			}
			const ids = pickedIds(next.values());
			return ids ? { phase: "picking", ids } : IDLE;
		}
		default: {
			const _exhaustive: never = event;
			return _exhaustive;
		}
	}
}

export function isPicked(state: MediaPickState, id: MediaId): boolean {
	return state.phase === "picking" && state.ids.has(id);
}

export function pickCount(state: MediaPickState): number {
	return state.phase === "picking" ? state.ids.size : 0;
}

export function photoClick(
	state: MediaPickState,
	id: MediaId,
	pointer: PointerKind,
): PhotoClick {
	if (state.phase === "picking") {
		return "toggle";
	}
	if (pointer === "fine") {
		return "open";
	}
	if (state.phase === "armed" && state.revealed === id) {
		return "open";
	}
	return "reveal";
}

export function checkmarkKind(
	state: MediaPickState,
	id: MediaId,
	pointer: PointerKind,
): CheckmarkKind {
	if (state.phase === "picking") {
		return "on";
	}
	if (state.phase === "armed" && state.revealed === id) {
		return "revealed";
	}
	if (pointer === "fine") {
		return "hover";
	}
	return "absent";
}

export function isPickGridPath(pathname: string): boolean {
	return pathname === "/" || /^\/albums\/[^/]+$/.test(pathname);
}

export function describePickDelete(ids: PickedIds): {
	readonly title: string;
	readonly confirmLabel: string;
	readonly description: string;
} {
	if (ids.size === 1) {
		for (const photo of ids.values()) {
			return {
				title: "Delete photo",
				confirmLabel: "Delete photo",
				description: `Delete ${photo.name}? This removes it from your library and every album. This cannot be undone.`,
			};
		}
	}
	const n = ids.size;
	return {
		title: `Delete ${n} photos`,
		confirmLabel: `Delete ${n} photos`,
		description: `Delete ${n} photos? This removes them from your library and every album. This cannot be undone.`,
	};
}
