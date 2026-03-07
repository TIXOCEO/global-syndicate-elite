"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useRouter } from "next/navigation";

export default function DeathPage() {

  const router = useRouter();

  const [nickname, setNickname] = useState<string | null>(null);
  const [tier, setTier] = useState<number>(0);
  const [crimes, setCrimes] = useState<number>(0);
  const [cash, setCash] = useState<number>(0);
  const [newName, setNewName] = useState("");

  async function hydrate() {
    try {

      const archive = await apiFetch("/api/character/archive");

      if (archive?.length > 0) {

        const last = archive[0];

        setNickname(last.nickname);
        setTier(last.tier);

      }

      const sync = await apiFetch("/api/state/sync").catch(() => null);

      if (sync?.resources) {

        setCash(sync.resources.cash ?? 0);

      }

    } catch (err) {
      console.error("Death screen hydration failed", err);
    }
  }

  async function createCharacter() {

    if (!newName) {
      alert("Enter a nickname");
      return;
    }

    try {

      await apiFetch("/api/character/create", {
        method: "POST",
        body: JSON.stringify({
          nickname: newName
        })
      });

      router.replace("/dashboard");

    } catch (err: any) {

      console.error("Character creation failed", err);
      alert("Character creation failed");

    }
  }

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-red-400">
        Operative Deceased
      </h1>

      <div className="bg-[#111827] border border-red-500 rounded-xl p-6 space-y-3">

        <p className="text-sm text-zinc-400">
          Your previous operative has fallen.
        </p>

        <div className="grid grid-cols-2 gap-4 pt-2">

          <div>
            <p className="text-xs text-zinc-500">
              Nickname
            </p>
            <p className="text-lg text-[#C6A756] font-semibold">
              {nickname ?? "Unknown"}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Tier Reached
            </p>
            <p className="text-lg text-[#C6A756] font-semibold">
              {tier}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Total Crimes
            </p>
            <p className="text-lg text-[#C6A756] font-semibold">
              {crimes}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Cash Accumulated
            </p>
            <p className="text-lg text-[#C6A756] font-semibold">
              ${cash}
            </p>
          </div>

        </div>

      </div>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-4">

        <h2 className="text-lg font-semibold text-[#C6A756]">
          Create New Operative
        </h2>

        <input
          placeholder="Nickname"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full bg-[#1F2937] border border-transparent rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6A756]"
        />

        <button
          onClick={createCharacter}
          className="w-full bg-[#C6A756] text-black py-3 rounded-lg font-semibold hover:opacity-90"
        >
          Deploy Operative
        </button>

      </div>

    </div>
  );
}
