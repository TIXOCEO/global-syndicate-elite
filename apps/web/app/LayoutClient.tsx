"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import GlobalHUD from "@/components/hud/GlobalHUD";
import BottomNav from "@/components/navigation/BottomNav";
import InstallModal from "@/components/pwa/InstallModal";
import { apiFetch } from "@/lib/apiClient";
import { useCharacterStore } from "@/stores/characterStore";
import { useResourceStore } from "@/stores/resourceStore";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  const router = useRouter();

  const hideHUD = pathname === "/login";

  const setCharacter = useCharacterStore((s) => s.setCharacter);
  const clearCharacter = useCharacterStore((s) => s.clearCharacter);

  const setResources = useResourceStore((s) => s.setResources);

  // TODO replace later with real character rank
  const characterRank = 2;

  async function bootClient() {

    try {

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

      if (!token) {

        if (pathname !== "/login") {
          router.replace("/login");
        }

        return;

      }

      const character = await apiFetch("/api/character/me");

      if (!character) {

        clearCharacter();
        router.replace("/dashboard");
        return;

      }

      setCharacter({
        id: character.id,
        nickname: character.nickname,
        tier: character.tier,
        hp: character.hp,
        notoriety: character.notoriety ?? 0,
        status: character.status
      });

      setResources({
        cash: character.cash,
        lead: character.lead,
        energy: character.energy?.energy ?? 0
      });

      if (character.status === "DEAD") {

        if (pathname !== "/death") {
          router.replace("/death");
        }

        return;

      }

    } catch (err) {

      console.error("Client boot failed", err);

      localStorage.removeItem("token");

      if (pathname !== "/login") {
        router.replace("/login");
      }

    }

  }

  useEffect(() => {

    bootClient();

  }, []);

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
