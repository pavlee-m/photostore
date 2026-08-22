import type { QueryClient } from "@tanstack/react-query";
import type { AuthSnapshot } from "#/types/auth.ts";

export type RouterContext = {
	queryClient: QueryClient;
	auth: AuthSnapshot;
};
