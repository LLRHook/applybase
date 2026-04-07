import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 62279,
    proxy: {
      "/api": "http://localhost:44455",
      "/t": "http://localhost:44455",
    },
  },
});
