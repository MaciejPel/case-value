import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import Unfonts from "unplugin-fonts/vite";

export default defineConfig({
	plugins: [
		sveltekit(),
		Unfonts({
			custom: {
				families: [
					{
						name: "Geist",
						src: "./static/fonts/geist/*.woff2",
					},
				],
			},
		}),
	],
});
