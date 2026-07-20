/**
 * Ajusta `datasource.provider` según DATABASE_URL:
 * - file:… → sqlite (local)
 * - postgres… → postgresql (Neon / Vercel)
 */
import fs from "node:fs";
import path from "node:path";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const url = process.env.DATABASE_URL ?? "file:./dev.db";
const provider = /^postgres(ql)?:/i.test(url) ? "postgresql" : "sqlite";

const schema = fs.readFileSync(schemaPath, "utf8");
const next = schema.replace(
  /(datasource\s+db\s*\{[^}]*?\bprovider\s*=\s*")(?:sqlite|postgresql)(")/s,
  `$1${provider}$2`,
);

if (next === schema && !schema.includes(`provider = "${provider}"`)) {
  console.error(
    `[sync-prisma-provider] No se pudo fijar provider=${provider} en prisma/schema.prisma`,
  );
  process.exit(1);
}

if (next !== schema) {
  fs.writeFileSync(schemaPath, next);
  console.log(`[sync-prisma-provider] provider = ${provider}`);
} else {
  console.log(`[sync-prisma-provider] ya estaba en ${provider}`);
}
