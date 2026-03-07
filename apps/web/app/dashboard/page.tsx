"use client";
import { useEffect } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useCharacterStore } from "@/stores/characterStore";
import { useResourceStore } from "@/stores/resourceStore";
import { useAuthStore } from "@/stores/authStore";
import { CRIMES } from "@/lib/crimeDefinitions";

export default function Dashboard() {

  const setCharacter = useCharacterStore((s) => s.setCharacter);
  const setResources = useResourceStore((s) => s.setResources);
  const setToken = useAuthStore((s) => s.setToken);

  const { cash, lead, energy } = useResourceStore();
  const { tier, nickname, hp, status } = useCharacterStore();

  useEffect(() => {

    async function hydrate() {

      const token = localStorage.getItem("token");

      if (!token) return;

      setToken(token);

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

      } catch (err) {

        console.error("Hydration failed", err);

      }

    }

    hydrate();

  }, []);

  return (

    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-gold">
        Dashboard
      </h1>

      {/* CHARACTER CARD */}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4 space-y-2">

        <div className="flex justify-between items-center">

          <div>

            <p className="text-sm text-zinc-400">
              Operative
            </p>

            <p className="text-lg font-semibold text-[#C6A756]">
              {nickname ?? "Unknown"}
            </p>

          </div>

          <div className="text-right">

            <p className="text-sm text-zinc-400">
              Tier
            </p>

            <p className="text-lg font-semibold text-[#C6A756]">
              {tier}
            </p>

          </div>

        </div>

        <div className="flex justify-between text-xs text-zinc-400">

          <span>HP</span>
          <span>{hp}</span>

        </div>

      </div>

      {/* STATUS BANNER */}

      {status === "CRITICAL" && (

        <div className="bg-orange-500/10 border border-orange-500 rounded-xl p-3 text-sm text-orange-300">

          Injury detected. Operations yield reduced rewards.

        </div>

      )}

      {status === "DEAD" && (

        <div className="bg-red-500/10 border border-red-500 rounded-xl p-3 text-sm text-red-300">

          Operative deceased. Create a new character.

        </div>

      )}

      {/* RESOURCE GRID (ORIGINAL CARDS PRESERVED) */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4">
          <h2 className="text-sm text-zinc-400">Cash</h2>
          <p className="text-xl font-semibold text-[#C6A756]">${cash}</p>
        </div>

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4">
          <h2 className="text-sm text-zinc-400">Lead</h2>
          <p className="text-xl font-semibold text-[#C6A756]">{lead}</p>
        </div>

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4">
          <h2 className="text-sm text-zinc-400">Energy</h2>
          <p className="text-xl font-semibold text-[#C6A756]">{energy}</p>
        </div>

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4">
          <h2 className="text-sm text-zinc-400">Tier</h2>
          <p className="text-xl font-semibold text-[#C6A756]">{tier}</p>
        </div>

      </div>

      {/* CRIME AVAILABILITY PREVIEW */}

      <div className="space-y-3">

        <h2 className="text-sm text-zinc-400">
          Available Operations
        </h2>

        {CRIMES.map((crime) => {

          const canRun = energy >= crime.energyCost;

          return (

            <div
              key={crime.key}
              className="bg-[#111827] border border-[#C6A756] rounded-lg p-3 flex justify-between items-center"
            >

              <div>

                <p className="text-sm text-[#C6A756]">
                  {crime.name}
                </p>

                <p className="text-xs text-zinc-400">
                  Energy Cost: {crime.energyCost}
                </p>

              </div>

              <div
                className={`text-xs font-semibold ${
                  canRun ? "text-green-400" : "text-red-400"
                }`}
              >
                {canRun ? "READY" : "INSUFFICIENT ENERGY"}
              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}
