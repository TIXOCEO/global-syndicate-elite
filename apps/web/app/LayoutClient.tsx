"use client";

import { usePathname } from "next/navigation";

import GlobalHUD from "@/components/hud/GlobalHUD";
import BottomNav from "@/components/navigation/BottomNav";
import InstallModal from "@/components/pwa/InstallModal";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();

  const hideHUD = pathname === "/login";

  // TODO replace later with real character rank
  const characterRank = 2;

  return (
    <div className="flex flex-col min-h-screen">

      {!hideHUD && <GlobalHUD />}

      {/* LOGIN PAGE = FULLSCREEN */}
      {hideHUD ? (
        <main className="flex-1">
          {children}
        </main>
      ) : (
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-20 pb-24">
          {children}
        </main>
      )}

      {!hideHUD && <BottomNav />}

      <InstallModal rank={characterRank} />

    </div>
  );
}
