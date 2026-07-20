"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import {
  createAdminSession,
  destroyAdminSession,
} from "@/lib/auth/session";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "Introduce la contraseña." };
  }

  const storedHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!storedHash) {
    return {
      error:
        "Falta ADMIN_PASSWORD_HASH en el entorno. Genera uno con npm run auth:hash.",
    };
  }

  const valid = verifyPassword(password, storedHash);
  if (!valid) {
    return { error: "Contraseña incorrecta." };
  }

  await createAdminSession();
  redirect("/admin/anadir");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/entrar");
}
