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

      const sync = await apiFetch("/api/state/sync");

      if (!sync?.character) {
        clearCharacter();
        router.replace("/dashboard");
        return;
      }

      setCharacter({
        id: sync.character.id,
        nickname: sync.character.nickname,
        tier: sync.character.tier,
        hp: sync.character.hp,
        notoriety: sync.character.notoriety ?? 0,
        status: sync.character.status,
        rxp: sync.character.rxp
      });

      setResources({
        cash: sync.resources.cash,
        lead: sync.resources.lead,
        energy: sync.resources.energy
      });

      if (sync.character.status === "DEAD") {
        if (pathname !== "/death") {
          router.replace("/death");
        }
        return;
      }

      if (sync.jail?.remaining > 0) {
        if (pathname !== "/jail") {
          router.replace("/jail");
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

      {hideHUD ? (
        <main className="flex-1">
          {children}
        </main>
      ) : (
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-20 pb-32">
          {children}
        </main>
      )}

      {!hideHUD && <BottomNav />}

      <InstallModal rank={characterRank} />

    </div>
  );
}
