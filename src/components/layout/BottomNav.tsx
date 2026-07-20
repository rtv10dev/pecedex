"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Fish, Map, PlusCircle } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const icons = {
  fish: Fish,
  camera: Camera,
  map: Map,
  plus: PlusCircle,
} as const;

const activeStyles = {
  fish: "bg-gradient-to-br from-lagoon to-tang text-white shadow-lg shadow-tang/40",
  camera:
    "bg-gradient-to-br from-anemone to-coral text-white shadow-lg shadow-anemone/40",
  map: "bg-gradient-to-br from-parrot to-biolum text-white shadow-lg shadow-parrot/40",
  plus: "bg-gradient-to-br from-coral to-anemone text-white shadow-lg shadow-coral/40",
} as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/recuerdos") {
    return pathname.startsWith("/recuerdos") || pathname.startsWith("/recuerdo/");
  }
  if (href === "/mapa") return pathname.startsWith("/mapa");
  if (href === "/admin/anadir") {
    return (
      pathname.startsWith("/admin/anadir") ||
      pathname.startsWith("/admin/recuerdo")
    );
  }
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 bg-shell/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <div aria-hidden className="rainbow-border absolute inset-x-0 top-0 h-[3px]" />
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-2">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon];
          const active = isActive(pathname, item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-[11px] font-semibold transition-all active:scale-95 sm:text-xs",
                  active ? "text-ink" : "text-mist hover:text-slate",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition-all sm:h-10 sm:w-10",
                    active
                      ? activeStyles[item.icon]
                      : "bg-foam-white text-mist",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
