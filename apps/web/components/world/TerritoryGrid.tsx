"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

type Cell = {
  gridX: number;
  gridY: number;
  ownerCharacterId?: string;
  controlPoints: number;
};

export default function TerritoryGrid() {

  const [cells, setCells] = useState<Cell[]>([]);

  async function load() {

    const state = await apiFetch("/api/state/sync");

    const res = await apiFetch(
      `/api/territory/list?countryId=${state.character.currentCountryId}`
    );

    setCells(res.territories);

  }

  useEffect(() => {
    load();
  }, []);

  return (

    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(20, 1fr)",
        gap: "2px"
      }}
    >

      {cells.map((cell, i) => {

        const owned = !!cell.ownerCharacterId;

        return (
          <div
            key={i}
            className={`h-6 ${
              owned
                ? "bg-[#C6A756]"
                : "bg-zinc-800"
            }`}
          />
        );

      })}

    </div>

  );
}
