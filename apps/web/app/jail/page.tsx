"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export default function JailPage() {

  const [remaining, setRemaining] = useState(0);

  async function hydrate() {

    try {

      const sync = await apiFetch("/api/state/sync");

      setRemaining(sync.jail?.remaining ?? 0);

    } catch (err) {

      console.error("Jail sync failed", err);

    }

  }

  useEffect(() => {

    hydrate();

  }, []);

  useEffect(() => {

    if (remaining <= 0) return;

    const timer = setInterval(() => {

      setRemaining((r) => Math.max(0, r - 1));

    }, 1000);

    return () => clearInterval(timer);

  }, [remaining]);

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Jail
      </h1>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 text-center space-y-3">

        <div className="text-sm text-zinc-400">
          You were arrested during a failed operation.
        </div>

        <div className="text-4xl font-semibold text-[#C6A756]">
          {remaining}s
        </div>

        <div className="text-sm text-zinc-500">
          Remaining sentence
        </div>

      </div>

    </div>
  );
}
