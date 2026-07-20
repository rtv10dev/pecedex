import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { hashPassword } from "../src/lib/auth/password";

const password = process.argv[2];
const writeEnv = process.argv.includes("--write-env");

if (!password || password.startsWith("--")) {
  console.error("Uso: npx tsx scripts/hash-password.ts <contraseña> [--write-env]");
  process.exit(1);
}

const hash = hashPassword(password);

if (writeEnv) {
  const envPath = resolve(process.cwd(), ".env");
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

  if (/^ADMIN_PASSWORD_HASH=/m.test(content)) {
    content = content.replace(
      /^ADMIN_PASSWORD_HASH=.*$/m,
      `ADMIN_PASSWORD_HASH="${hash}"`,
    );
  } else {
    content += `\nADMIN_PASSWORD_HASH="${hash}"\n`;
  }

  writeFileSync(envPath, content);
  console.log("ADMIN_PASSWORD_HASH actualizado en .env");
} else {
  console.log(hash);
  console.log('\nCopia esto en .env como ADMIN_PASSWORD_HASH="..."');
}
