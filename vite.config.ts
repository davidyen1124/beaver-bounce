import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Relative asset paths, so the build works at /beaver-bounce/ on GitHub Pages,
// at the root of a custom domain, or in whatever folder you drag it into.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
