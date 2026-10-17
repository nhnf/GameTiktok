import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Builds a fresh, migrated and seeded test database before the suite runs. */
export default function setup(): void {
  const serverDir = fileURLToPath(new URL("../..", import.meta.url));
  const env = { ...process.env, DATABASE_URL: "file:./test.db" };
  for (const suffix of ["", "-journal"]) rmSync(`${serverDir}/prisma/test.db${suffix}`, { force: true });
  execSync("npx prisma migrate deploy", { cwd: serverDir, env, stdio: "ignore" });
  execSync("npx tsx prisma/seed.ts", { cwd: serverDir, env, stdio: "ignore" });
}
