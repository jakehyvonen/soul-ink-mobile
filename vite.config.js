/**
 * Descriptor: Vite and Vitest configuration for a subpath-safe PBM build.
 * Usage: `npm run build` emits `dist/` assets whose URLs resolve under `/pbm/`.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
