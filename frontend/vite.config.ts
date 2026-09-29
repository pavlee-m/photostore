import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

const apiProxy = process.env.VITE_DEV_API_PROXY ?? "http://localhost:8080";
const nitroRouteRules =
	typeof apiProxy === "string" && apiProxy.length > 0
		? {
				"/api/**": {
					proxy: `${apiProxy}/api/**`,
				},
			}
		: undefined;

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	server: {
		port: 3000,
	},
	plugins: [
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		nitro({
			preset: "bun",
			...(nitroRouteRules ? { routeRules: nitroRouteRules } : {}),
		}),
	],
});

export default config;
