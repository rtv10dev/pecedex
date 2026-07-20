import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/anadir");
  }

  return (
    <>
      <Header
        title="Entrar al arrecife"
        subtitle="Aurora y Rafa · contraseña para añadir avistamientos"
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <div className="overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/95 shadow-xl shadow-coral/25">
          <div className="h-1.5 bg-gradient-to-r from-coral via-anemone to-tang" />
          <div className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-anemone shadow-md shadow-coral/40">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-ink">Vuestro arrecife</h2>
                <p className="text-sm text-slate">
                  Solo Aurora y Rafa pueden registrar avistamientos
                </p>
              </div>
            </div>

            <LoginForm />
          </div>
        </div>
      </main>
    </>
  );
}
