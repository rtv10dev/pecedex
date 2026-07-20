import { createRequire } from "node:module";
import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

const require = createRequire(import.meta.url);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isPostgresUrl(url: string) {
  return /^postgres(ql)?:/i.test(url);
}

function resolveSqlitePath(url: string) {
  const relative = url.replace(/^file:/, "");
  if (path.isAbsolute(relative)) return relative;
  return path.join(process.cwd(), relative);
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

  if (isPostgresUrl(databaseUrl)) {
    const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
    const { Pool } = require("pg") as typeof import("pg");
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  const { PrismaBetterSqlite3 } = require(
    "@prisma/adapter-better-sqlite3",
  ) as typeof import("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({
    url: resolveSqlitePath(databaseUrl),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
