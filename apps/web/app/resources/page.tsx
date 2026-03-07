"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useResourceStore } from "@/stores/resourceStore";

export default function ResourcesPage() {

  const setResources = useResourceStore((s) => s.setResources);
  const { cash, lead, energy } = useResourceStore();

  const [bullets, setBullets] = useState(0);

  async function hydrate() {
    try {

      const data = await apiFetch("/api/character/resources");

      setResources({
        cash: data.wallet.cash,
        lead: data.wallet.lead,
        energy: data.energy
      });

      setBullets(data.wallet.bullets ?? 0);

    } catch (err) {
      console.error("Resource hydration failed", err);
    }
  }

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Resources
      </h1>

      {/* RESOURCE GRID */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* CASH */}

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-5">

          <h2 className="text-sm text-zinc-400">
            Cash
          </h2>

          <p className="text-2xl font-semibold text-[#C6A756]">
            ${cash}
          </p>

        </div>

        {/* LEAD */}

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-5">

          <h2 className="text-sm text-zinc-400">
            Lead Inventory
          </h2>

          <p className="text-2xl font-semibold text-[#C6A756]">
            {lead} kg
          </p>

        </div>

        {/* BULLETS */}

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-5">

          <h2 className="text-sm text-zinc-400">
            Bullets
          </h2>

          <p className="text-2xl font-semibold text-[#C6A756]">
            {bullets}
          </p>

        </div>

        {/* ENERGY */}

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-5">

          <h2 className="text-sm text-zinc-400">
            Energy
          </h2>

          <p className="text-2xl font-semibold text-[#C6A756]">
            {energy}
          </p>

        </div>

      </div>

      {/* ECONOMY PLACEHOLDER */}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6">

        <h2 className="text-lg font-semibold text-[#C6A756] mb-2">
          Economy
        </h2>

        <p className="text-sm text-zinc-400">
          Economic analytics and production graphs will appear here in future updates.
        </p>

      </div>

    </div>
  );
}
