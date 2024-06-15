import { defineConfig } from "vite";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/canvas-image/",
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "canvas-image",
      fileName: "canvas-image",
    },
  },
});
