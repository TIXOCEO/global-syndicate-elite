"use client";

import TerritoryGrid from "@/components/world/TerritoryGrid";

export default function TerritoryPage() {

  return (
    <div className="max-w-5xl mx-auto px-4 pt-16 pb-20">

      <h1 className="text-xl text-[#C6A756] mb-6">
        Territory Map
      </h1>

      <TerritoryGrid />

    </div>
  );
}
