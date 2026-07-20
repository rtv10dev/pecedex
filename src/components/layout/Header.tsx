import { Fish } from "lucide-react";
import { APP_NAME, REEF_TITLE } from "@/lib/constants";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({
  title = REEF_TITLE,
  subtitle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-shell/75 px-4 py-3 backdrop-blur-md">
      <div
        aria-hidden
        className="rainbow-border absolute inset-x-0 bottom-0 h-[3px]"
      />
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-coral via-clownfish to-mango shadow-lg shadow-clownfish/40">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/30 to-transparent" />
          <Fish className="relative h-6 w-6 text-white drop-shadow-sm" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="bg-gradient-to-r from-coral via-clownfish to-tang bg-clip-text text-xs font-bold uppercase tracking-[0.18em] text-transparent">
            {APP_NAME}
          </p>
          <h1 className="truncate text-lg font-bold text-ink">{title}</h1>
          {subtitle ? (
            <p className="truncate text-sm font-medium text-deep-teal/80">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
