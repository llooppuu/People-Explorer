import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    pool: "threads",
    globals: true,
    include: ["src/tests/**/*.test.ts"]
  }
});
