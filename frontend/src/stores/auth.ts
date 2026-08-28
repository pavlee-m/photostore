import { create } from "zustand";
import type { AuthSnapshot } from "#/types/auth.ts";
import type { User } from "#/types/user.ts";

type AuthState = AuthSnapshot & {
	hydrate: (snapshot: AuthSnapshot) => void;
	setUser: (user: User | null) => void;
	setFounderExists: (founderExists: boolean) => void;
	clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	founderExists: false,
	hydrate: (snapshot) => set(snapshot),
	setUser: (user) => set({ user }),
	setFounderExists: (founderExists) => set({ founderExists }),
	clear: () => set({ user: null }),
}));
