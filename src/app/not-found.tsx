import Link from "next/link";
import { FishOff } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AppShell } from "@/components/layout/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <Header title="No encontrado" subtitle="Esta página no existe" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <div className="overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/90 text-center shadow-xl shadow-coral/20">
          <div className="rainbow-border h-1.5" />
          <div className="p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-coral/30 via-clownfish/30 to-mango/30">
              <FishOff className="h-8 w-8 text-coral" />
            </div>
            <h2 className="text-lg font-bold text-ink">Página no encontrada</h2>
            <p className="mt-2 text-sm text-slate">
              Ese pez se escapó del arrecife. Vuelve a la galería o al mapa.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href="/"
                className="rounded-full bg-tang px-4 py-2 text-sm font-bold text-white"
              >
                Galería
              </Link>
              <Link
                href="/mapa"
                className="rounded-full bg-lagoon/15 px-4 py-2 text-sm font-bold text-deep-teal"
              >
                Mapa
              </Link>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
