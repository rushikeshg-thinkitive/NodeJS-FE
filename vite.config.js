import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React app served on port 5173. The backend runs separately on port 5000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
