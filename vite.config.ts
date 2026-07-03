import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("react-router") || id.includes("@tanstack")) {
            return "vendor-routing-data";
          }

          if (id.includes("firebase") || id.includes("socket.io") || id.includes("axios")) {
            return "vendor-networking";
          }

          if (id.includes("lucide-react") || id.includes("class-variance-authority") || id.includes("tailwind-merge") || id.includes("clsx")) {
            return "vendor-ui";
          }

          return "vendor-core";
        },
      },
    },
  },
}));
