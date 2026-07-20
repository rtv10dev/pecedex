"use client";

import { Fish } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface OceanModelSpinnerProps {
  className?: string;
  label?: string;
}

/** Fondo submarino + pez nadando + burbujas mientras carga el GLB. */
export function OceanModelSpinner({
  className,
  label = "Cargando modelo 3D…",
}: OceanModelSpinnerProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-sky-400 via-reef to-deep-teal",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-70",
          !reducedMotion && "caustics",
        )}
      />

      {/* Burbujas */}
      {!reducedMotion ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {[
            { left: "18%", delay: "0s", size: "0.55rem", duration: "3.2s" },
            { left: "42%", delay: "0.6s", size: "0.4rem", duration: "2.8s" },
            { left: "68%", delay: "1.1s", size: "0.7rem", duration: "3.6s" },
            { left: "82%", delay: "0.3s", size: "0.35rem", duration: "2.5s" },
            { left: "30%", delay: "1.5s", size: "0.5rem", duration: "3.1s" },
          ].map((bubble) => (
            <span
              key={`${bubble.left}-${bubble.delay}`}
              className="absolute bottom-4 rounded-full bg-white/55 shadow-[inset_0_0_4px_rgba(255,255,255,0.8)]"
              style={{
                left: bubble.left,
                width: bubble.size,
                height: bubble.size,
                animation: `bubble-rise ${bubble.duration} linear infinite`,
                animationDelay: bubble.delay,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="relative z-10 flex flex-col items-center gap-3 px-4">
        <div
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-full bg-white/20 shadow-lg ring-2 ring-white/35 backdrop-blur-sm",
            !reducedMotion && "ocean-fish-swim",
          )}
        >
          <Fish
            className="h-8 w-8 text-white drop-shadow-md"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
        <p className="text-sm font-bold text-white/95 drop-shadow-sm">{label}</p>
      </div>
    </div>
  );
}
