"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS, type SortBy } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SortControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortBy = (searchParams.get("orden") as SortBy) || "registeredAt";

  function setSortBy(value: SortBy) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "registeredAt") {
      params.delete("orden");
    } else {
      params.set("orden", value);
    }
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Ordenar avistamientos">
      {SORT_OPTIONS.map((option) => {
        const active = sortBy === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setSortBy(option.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95",
              active
                ? option.value === "registeredAt"
                  ? "bg-gradient-to-r from-tang to-anemone text-white shadow-lg shadow-tang/35"
                  : "bg-gradient-to-r from-parrot to-biolum text-white shadow-lg shadow-parrot/35"
                : "border-2 border-white/70 bg-shell/70 text-slate shadow-sm backdrop-blur-sm hover:border-lagoon/40",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
