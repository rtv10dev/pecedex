import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AddMemoryForm } from "@/components/admin/AddMemoryForm";
import { requireAdminSession } from "@/lib/auth/session";

export default async function AdminAddMemoryPage() {
  await requireAdminSession();

  return (
    <>
      <Header
        title="Añadir recuerdo"
        subtitle="Una foto, una historia, una fecha"
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            href="/recuerdos"
            className="inline-flex items-center gap-2 rounded-full bg-shell/80 px-3 py-1.5 text-sm font-bold text-anemone shadow-sm backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Recuerdos
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/anadir"
              className="rounded-full bg-tang/15 px-3 py-1.5 text-xs font-bold text-tang"
            >
              Pez
            </Link>
            <LogoutButton />
          </div>
        </div>

        <AddMemoryForm />
      </main>
    </>
  );
}
