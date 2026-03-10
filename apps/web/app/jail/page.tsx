"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import Image from "next/image";

export default function JailPage() {
  const [prisoners, setPrisoners] = useState<any[]>([]);
  const [myJailTime, setMyJailTime] = useState(0);
  const [jailXp, setJailXp] = useState(0);
  const [modal, setModal] = useState<any>(null);

  async function loadData() {
    const state = await apiFetch("/api/state/sync");

    setMyJailTime(state.jail.remaining);
    setJailXp(state.skills?.jailXp ?? 0);

    const list = await apiFetch("/api/jail/list");
    setPrisoners(list.prisoners);
  }

  async function breakout() {
    const res = await apiFetch("/api/jail/break", {
      method: "POST"
    });

    if (res.success) {
      setModal("/images/jail/jail-breaksucces.jpg");
    } else {
      setModal("/images/jail/jail-breakfailed.jpg");
    }

    loadData();
  }

  async function bust(targetId: string) {
    const res = await apiFetch("/api/jail/bust", {
      method: "POST",
      body: JSON.stringify({ targetCharacterId: targetId })
    });

    if (res.success) {
      setModal("/images/jail/jail-bustsucces.jpg");
    } else {
      setModal("/images/jail/jail-bustfailed.jpg");
    }

    loadData();
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Jail
      </h1>

      {/* JAIL XP PANEL */}
      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">
            Prison Knowledge
          </span>
          <span className="text-[#C6A756] font-semibold">
            Jail XP: {jailXp.toFixed(2)}
          </span>
        </div>
      </div>

      {myJailTime > 0 && (
        <div className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden">

          <Image
            src="/images/jail/jail-inmate.jpg"
            alt="jail"
            width={1000}
            height={600}
            className="w-full object-cover"
          />

          <div className="p-4 space-y-3">

            <div className="text-orange-400 text-sm">
              You are currently incarcerated.
            </div>

            <div className="flex justify-between text-sm">
              <span>Sentence Remaining</span>
              <span className="text-[#C6A756] font-semibold">
                {myJailTime}s
              </span>
            </div>

            <button
              onClick={breakout}
              className="w-full bg-[#C6A756] text-black py-2 rounded-lg font-semibold"
            >
              Attempt Breakout
            </button>

          </div>
        </div>
      )}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden">

        <Image
          src="/images/jail/jail-list.jpg"
          alt="jail list"
          width={1000}
          height={600}
          className="w-full object-cover"
        />

        <div className="p-4 space-y-4">

          <h2 className="text-lg text-[#C6A756] font-semibold">
            Current Prisoners
          </h2>

          {prisoners.map((p) => (
            <div
              key={p.characterId}
              className="flex justify-between items-center border-b border-zinc-800 py-2"
            >

              <div>
                <p className="text-sm text-[#C6A756]">
                  {p.nickname}
                </p>

                <p className="text-xs text-zinc-400">
                  Tier {p.tier}
                </p>
              </div>

              <div className="flex items-center gap-4">

                <span className="text-xs text-zinc-400">
                  {p.remainingSeconds}s
                </span>

                {myJailTime === 0 && (
                  <button
                    onClick={() => bust(p.characterId)}
                    className="text-xs bg-[#C6A756] text-black px-3 py-1 rounded"
                  >
                    Bust
                  </button>
                )}

              </div>

            </div>
          ))}

        </div>
      </div>

      {modal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setModal(null)}
        >
          <Image
            src={modal}
            alt="result"
            width={600}
            height={600}
            className="rounded-xl"
          />
        </div>
      )}

    </div>
  );
}
