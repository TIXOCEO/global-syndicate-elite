"use client";

import { useEffect } from "react";

import { apiFetch } from "@/lib/apiClient";
import { useCharacterStore } from "@/stores/characterStore";
import { useResourceStore } from "@/stores/resourceStore";
import { useAuthStore } from "@/stores/authStore";

export default function Dashboard() {

  const setCharacter = useCharacterStore((s) => s.setCharacter);
  const setResources = useResourceStore((s) => s.setResources);
  const setToken = useAuthStore((s) => s.setToken);

  const { cash, lead, energy } = useResourceStore();
  const { tier } = useCharacterStore();

  useEffect(() => {

    async function hydrate() {

      const token = localStorage.getItem("token");

      if (!token) return;

      setToken(token);

      try {

        const character = await apiFetch("/character/me");

        setCharacter({
          id: character.id,
          nickname: character.nickname,
          tier: character.tier,
          hp: character.hp,
          notoriety: character.notoriety,
          status: character.status
        });

        setResources({
          cash: character.cash,
          lead: character.lead,
          energy: character.energy
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

    </div>
  );

}
