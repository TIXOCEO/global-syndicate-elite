"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

export default function JailPage() {

  const router = useRouter();

  const [remaining, setRemaining] = useState(0);
  const [jailXp, setJailXp] = useState(0);

  async function hydrate() {
    try {

      const sync = await apiFetch("/api/state/sync");

      const jailRemaining = sync.jail?.remaining ?? 0;

      if (jailRemaining <= 0) {
        router.push("/dashboard");
        return;
      }

      setRemaining(jailRemaining);
      setJailXp(sync.skills?.jailXp ?? 0);

    } catch (err) {
      console.error("Jail hydration failed", err);
    }
  }

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {

    if (remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(timer);

  }, [remaining]);

  function formatTime(seconds: number) {

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-red-400">
        You are jailed
      </h1>

      <div className="bg-[#111827] border border-red-500 rounded-xl p-6 space-y-4">

        <div className="text-sm text-zinc-400">
          Remaining sentence
        </div>

        <div className="text-4xl font-bold text-red-400">
          {formatTime(remaining)}
        </div>

      </div>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-3">

        <h2 className="text-lg font-semibold text-[#C6A756]">
          Jail Experience
        </h2>

        <div className="text-2xl font-semibold text-[#C6A756]">
          {jailXp}
        </div>

        <p className="text-sm text-zinc-400">
          Time spent in jail increases your breakout expertise.
        </p>

      </div>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-4">

        <h2 className="text-lg font-semibold text-[#C6A756]">
          Options
        </h2>

        <button
          disabled
          className="w-full bg-zinc-700 text-zinc-400 py-3 rounded-lg font-semibold"
        >
          Breakout Attempt (coming soon)
        </button>

        <button
          disabled
          className="w-full bg-zinc-700 text-zinc-400 py-3 rounded-lg font-semibold"
        >
          Pay Bail (coming soon)
        </button>

      </div>

    </div>
  );
}
