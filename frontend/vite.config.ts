import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

const apiProxyTarget = process.env.VITE_DEV_API_PROXY ?? "http://localhost:8080";
const viteDevApiProxy = process.env.VITE_DEV_API_PROXY;
const nitroRouteRules =
	typeof viteDevApiProxy === "string" && viteDevApiProxy.length > 0
		? {
				"/api/**": {
					proxy: `${viteDevApiProxy.replace(/\/$/, "")}/api/**`,
				},
			}
		: undefined;

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	server: {
		port: 3000,
		proxy: {
			"/api": {
				target: apiProxyTarget,
				changeOrigin: true,
			},
		},
	},
	plugins: [
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		nitro({
			preset: "bun",
			// Nitro SSR does not see Vite's Connect proxy. Install /api only when
			// compose.dev sets VITE_DEV_API_PROXY. Production `bun run build` has no env.
			...(nitroRouteRules ? { routeRules: nitroRouteRules } : {}),
		}),
	],
});

export default config;
