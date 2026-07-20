import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isPostgresUrl(url: string) {
  return /^postgres(ql)?:/i.test(url);
}

function resolveSqlitePath(url: string) {
  const relative = url.replace(/^file:/, "");
  if (path.isAbsolute(relative)) return relative;
  // turbopackIgnore: only used for local SQLite path resolution
  return path.join(/*turbopackIgnore: true*/ process.cwd(), relative);
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

  if (isPostgresUrl(databaseUrl)) {
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

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
