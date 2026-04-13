import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build",
    sourcemap: false,
  },
  // THIS IS THE KEY FIX - Force Vite to treat .js files as JSX
  esbuild: {
    loader: "jsx",
    include: /\.(js|jsx)$/,
    exclude: [],
  },
});
