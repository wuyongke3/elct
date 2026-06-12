import fs from "node:fs";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { electronSimple } from "vite-plugin-electron/multi-env";
import { notBundle } from "vite-plugin-electron/plugin";

export default defineConfig(({ command }) => {
  fs.rmSync("dist-electron", { recursive: true, force: true });

  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    plugins: [
      vue(),
      electronSimple({
        main: {
          input: "electron/main/index.ts",
          plugins: [notBundle()],
          options: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
            },
          },
        },
        preload: {
          input: "electron/preload/index.ts",
          plugins: [notBundle()],
          options: {
            build: {
              sourcemap: sourcemap ? "inline" : undefined,
              minify: isBuild,
              outDir: "dist-electron/preload",
            },
          },
        },
      }),
    ],
    clearScreen: false,
  };
});
