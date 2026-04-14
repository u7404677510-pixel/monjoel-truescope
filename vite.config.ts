import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/app/truescope/",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/firestore", "firebase/storage", "firebase/auth", "firebase/functions"],
          vendor: ["react", "react-dom", "react-router-dom", "react-hook-form"],
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});
