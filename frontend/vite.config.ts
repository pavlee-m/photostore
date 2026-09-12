import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxyTarget = process.env.VITE_DEV_API_PROXY ?? "http://localhost:8080";

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
	plugins: [tailwindcss(), tanstackStart(), viteReact()],
});

export default config;
