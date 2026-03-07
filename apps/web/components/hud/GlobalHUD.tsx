"use client";
import { useResourceStore } from "@/stores/resourceStore";
import { useCharacterStore } from "@/stores/characterStore";
import { apiFetch } from "@/lib/apiClient";
import { socket } from "@/lib/socket";
import { useEffect } from "react";

export default function GlobalHUD() {

  const { cash, lead, energy, pulse, setResources } = useResourceStore();
  const { hp, setCharacter } = useCharacterStore();

  const hpPercent = Math.max(0, Math.min(100, hp / 10));
  const energyPercent = Math.max(0, Math.min(100, energy));

  function getEnergyColor() {
    if (energyPercent > 66) return "bg-green-500";
    if (energyPercent > 33) return "bg-orange-400";
    return "bg-red-500";
  }

  async function hydrateHUD() {
    try {

      const sync = await apiFetch("/api/state/sync");

      setCharacter({
        id: sync.character.id,
        nickname: sync.character.nickname,
        tier: sync.character.tier,
        hp: sync.character.hp,
        notoriety: sync.character.notoriety ?? 0,
        status: sync.character.status
      });

      setResources({
        cash: sync.resources.cash,
        lead: sync.resources.lead,
        energy: sync.resources.energy
      });

    } catch (e) {
      console.error("HUD hydration failed", e);
    }
  }

  useEffect(() => {

    hydrateHUD();

    const interval = setInterval(() => {
      hydrateHUD();
    }, 15000);

    socket.on("state_update", (payload: any) => {

      if (payload.cash !== undefined || payload.lead !== undefined) {

        setResources({
          cash: payload.cash ?? cash,
          lead: payload.lead ?? lead
        });

      }

    });

    socket.on("crime_result", () => {
      hydrateHUD();
    });

    return () => {

      clearInterval(interval);

      socket.off("state_update");
      socket.off("crime_result");

    };

  }, []);

  return (

    <div className="fixed top-0 left-0 right-0 z-50">

      <div className={`bg-[#0B1220] border-b border-[#C6A756] ${pulse ? "shadow-[0_0_12px_rgba(198,167,86,0.6)]" : ""}`}>

        <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">

          <div className="flex justify-between items-center text-xs">

            <div className="font-bold text-[#C6A756]">GSE</div>

            <div className="flex gap-4 text-zinc-300">

              <span>$ {cash}</span>
              <span>Lead {lead}</span>

            </div>

          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400">

            <span className="w-6">HP</span>

            <div className="flex-1 h-2 bg-zinc-800 rounded overflow-hidden">

              <div
                className="h-full bg-[#C6A756] transition-all duration-500"
                style={{ width: `${hpPercent}%` }}
              />

            </div>

            <span className="w-10 text-right">{hp}</span>

            <span className="mx-2 text-zinc-500">|</span>

            <span>⚡</span>

            <div className="flex-1 h-2 bg-zinc-800 rounded overflow-hidden">

              <div
                className={`h-full transition-all duration-500 ${getEnergyColor()}`}
                style={{ width: `${energyPercent}%` }}
              />

            </div>

            <span className="w-8 text-right">{energy}</span>

          </div>

        </div>

      </div>

    </div>

  );
}
