"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full bg-shell/80 px-3 py-1.5 text-sm font-bold text-coral shadow-sm backdrop-blur-sm transition active:scale-95"
      >
        <LogOut className="h-4 w-4" />
        Salir
      </button>
    </form>
  );
}
