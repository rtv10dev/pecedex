import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AddSightingForm } from "@/components/admin/AddSightingForm";
import { requireAdminSession } from "@/lib/auth/session";

export default async function AdminAddPage() {
  await requireAdminSession();

  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());

  return (
    <>
      <Header title="Añadir avistamiento" subtitle="Nuevo registro de Aurora y Rafa" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-shell/80 px-3 py-1.5 text-sm font-bold text-tang shadow-sm backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Galería
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/recuerdo"
              className="rounded-full bg-anemone/15 px-3 py-1.5 text-xs font-bold text-anemone"
            >
              Recuerdo
            </Link>
            <LogoutButton />
          </div>
        </div>

        {!hasGemini ? (
          <p className="mb-4 rounded-2xl border border-clownfish/30 bg-clownfish/10 px-3 py-2 text-sm font-medium text-ink">
            Sin <code className="font-bold">GEMINI_API_KEY</code> puedes guardar
            rellenando a mano; la identificación automática quedará desactivada.
          </p>
        ) : null}

        <AddSightingForm />
      </main>
    </>
  );
}
