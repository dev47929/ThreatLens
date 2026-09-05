import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || "https://api.codesena.me";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      strictPort: false,
      host: true,
      proxy: {
        "/tc-auth": {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        "/repo": {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        "/chain": {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        "/eth": {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        "/attack": {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
