import { defineConfig } from "@lovable.dev/vite-tanstack-config";

process.env.NITRO_PRESET = "node-server";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  vite: {
    server: {
      open: true,
      port: 8080,
    },
  },
});