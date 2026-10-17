import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Tests run against their own SQLite file (prisma/test.db), never the dev database.
    env: { DATABASE_URL: "file:./test.db" },
    globalSetup: ["tests/setup/globalSetup.ts"],
    fileParallelism: false,
  },
});
