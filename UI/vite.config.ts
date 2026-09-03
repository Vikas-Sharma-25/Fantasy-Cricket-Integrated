import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const heroFixed = "C:/Users/Administrator/.gemini/antigravity/brain/d2992faf-dc46-4980-91ce-cae224a5aba3/hero_cricket_fixed_1788352390380.jpg";
const authFixed = "C:/Users/Administrator/.gemini/antigravity/brain/d2992faf-dc46-4980-91ce-cae224a5aba3/auth_side_fixed_1788352480553.jpg";

try {
  if (fs.existsSync(heroFixed)) {
    fs.copyFileSync(heroFixed, path.resolve("src/assets/hero-cricket.jpg"));
    fs.copyFileSync(heroFixed, path.resolve("public/hero-cricket.jpg"));
  }
  if (fs.existsSync(authFixed)) {
    fs.copyFileSync(authFixed, path.resolve("src/assets/auth-side.jpg"));
    fs.copyFileSync(authFixed, path.resolve("public/auth-side.jpg"));
  }
} catch (e) {
  console.warn("Asset sync error:", e);
}

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