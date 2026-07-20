import type { CSSProperties } from "react";

const BUBBLES = [
  { left: "8%", size: 10, duration: "14s", delay: "0s" },
  { left: "18%", size: 6, duration: "11s", delay: "2s" },
  { left: "32%", size: 14, duration: "16s", delay: "4s" },
  { left: "48%", size: 8, duration: "12s", delay: "1s" },
  { left: "62%", size: 12, duration: "15s", delay: "3.5s" },
  { left: "76%", size: 7, duration: "10s", delay: "5s" },
  { left: "88%", size: 11, duration: "13s", delay: "1.5s" },
] as const;

export function TropicalBackground() {
  return (
    <>
      {/* Cielo → laguna → arrecife */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-sky via-lagoon to-reef"
      />
      {/* Manchas de color tropical */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 50% 40% at 10% 20%, rgba(251, 146, 60, 0.35), transparent),
            radial-gradient(ellipse 40% 35% at 90% 30%, rgba(244, 114, 182, 0.3), transparent),
            radial-gradient(ellipse 45% 40% at 70% 85%, rgba(129, 140, 248, 0.35), transparent),
            radial-gradient(ellipse 35% 30% at 20% 75%, rgba(52, 211, 153, 0.25), transparent)
          `,
        }}
      />
      {/* Caustics de sol */}
      <div
        aria-hidden
        className="caustics pointer-events-none fixed inset-0 -z-10 opacity-[0.28]"
      />
      {/* Brillo superior (superficie) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-white/40 via-mango/10 to-transparent"
      />
      {/* Burbujas */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        {BUBBLES.map((bubble, i) => (
          <span
            key={i}
            className="bubble"
            style={
              {
                left: bubble.left,
                width: bubble.size,
                height: bubble.size,
                "--duration": bubble.duration,
                "--delay": bubble.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}
