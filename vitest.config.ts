import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig(({ mode }) => ({
  plugins:
    mode === "test" ? [svelte({ hot: false, compilerOptions: { dev: true } })] : [sveltekit()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts}"],
    outputFile: {
      json: ".log/unit/results.json",
      html: ".log/unit/index.html",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: ".log/unit/coverage",
      exclude: ["node_modules/", "src/test/"],
    },
  },
  resolve: {
    alias: {
      $lib: "/src/lib",
      "@": "/src/lib",
      svelte: "svelte",
    },
    conditions: ["browser"],
  },
}));
