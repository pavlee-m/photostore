import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { ApiError } from "#/api/client.ts";
import { PageError, PagePending } from "#/components/page-status.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import type { RouterContext } from "#/types/router.ts";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const queryClient = new QueryClient({
		queryCache: new QueryCache({
			onError: (error) => {
				toastApiError(error);
			},
		}),
		mutationCache: new MutationCache({
			onError: (error) => {
				toastApiError(error);
			},
		}),
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				retry: (failureCount, error) => {
					if (
						error instanceof ApiError &&
						error.status > 0 &&
						error.status < 500
					) {
						return false;
					}
					return failureCount < 1;
				},
			},
		},
	});

	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultPendingComponent: PagePending,
		defaultErrorComponent: PageError,
		context: {
			queryClient,
			auth: {
				user: null,
				founderExists: false,
			},
		} satisfies RouterContext,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
