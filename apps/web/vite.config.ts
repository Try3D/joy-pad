import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, "../../"),
  plugins: [react()],
});
