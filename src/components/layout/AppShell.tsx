import { BottomNav } from "@/components/layout/BottomNav";
import { TropicalBackground } from "@/components/layout/TropicalBackground";
import { FOOTER_CREDIT } from "@/lib/constants";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <TropicalBackground />
      <div className="relative z-10 flex min-h-dvh flex-col pb-24">
        {children}
        <footer className="mt-auto px-4 pb-3 pt-6 text-center">
          <p className="text-xs font-medium tracking-wide text-deep-teal/55">
            {FOOTER_CREDIT}
          </p>
        </footer>
      </div>
      <BottomNav />
    </div>
  );
}
