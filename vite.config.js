/**
 * Descriptor: Vite and Vitest configuration for a subpath-safe PBM build.
 * Usage: `npm run build` emits `dist/` assets whose URLs resolve under `/pbm/`.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const SIGMUND_DEVELOPMENT_URL = process.env.SIGMUND_DEV_URL || "http://127.0.0.1:8089";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    proxy: {
      "/ws": {
        target: SIGMUND_DEVELOPMENT_URL,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
