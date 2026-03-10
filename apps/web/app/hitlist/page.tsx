"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import {
  Target,
  Coins,
  Clock,
  Crosshair,
  Eye
} from "lucide-react";

type Contract = {
  contractId: string;
  targetNickname: string;
  reward: number;
  deadline: number;
  minBulletsRequired: number;
};

export default function HitlistPage() {

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const [targetCharacterId, setTargetCharacterId] = useState("");
  const [rewardCash, setRewardCash] = useState(2000);
  const [deadlineHours, setDeadlineHours] = useState(24);
  const [minBullets, setMinBullets] = useState(50);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadContracts() {

    try {

      const res = await apiFetch("/api/hitlist/list");

      setContracts(res.contracts || []);

    } catch (err) {
      console.error(err);
    }

    setLoading(false);

  }

  useEffect(() => {
    loadContracts();
  }, []);

  async function createContract() {

    setSubmitting(true);
    setMessage(null);

    try {

      const deadline =
        Date.now() + deadlineHours * 60 * 60 * 1000;

      await apiFetch("/api/hitlist/create", {
        method: "POST",
        body: JSON.stringify({
          targetCharacterId,
          rewardCash,
          deadline,
          minBullets
        })
      });

      setMessage("Contract created successfully");

      setTargetCharacterId("");

      loadContracts();

    } catch (err: any) {

      setMessage(err.message || "Failed to create contract");

    }

    setSubmitting(false);

  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">

      <h1 className="text-2xl font-bold text-[#C6A756] flex items-center gap-2">
        <Target size={24} />
        Hitlist Contracts
      </h1>

      {/* ACTIVE CONTRACTS */}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden">

        <div className="px-4 py-3 border-b border-zinc-700 font-semibold text-[#C6A756]">
          Active Contracts
        </div>

        {loading ? (

          <div className="p-4 text-zinc-400 text-sm">
            Loading contracts...
          </div>

        ) : contracts.length === 0 ? (

          <div className="p-4 text-zinc-400 text-sm">
            No active contracts.
          </div>

        ) : (

          <div className="divide-y divide-zinc-800">

            {contracts.map((contract) => {

              const remaining =
                contract.deadline - Date.now();

              const hours =
                Math.max(
                  0,
                  Math.floor(remaining / 3600000)
                );

              return (
                <div
                  key={contract.contractId}
                  className="flex items-center justify-between px-4 py-4 text-sm"
                >

                  <div className="space-y-1">

                    <div className="font-semibold text-white">
                      {contract.targetNickname}
                    </div>

                    <div className="flex items-center gap-3 text-zinc-400">

                      <span className="flex items-center gap-1">
                        <Coins size={14} />
                        {contract.reward}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {hours}h
                      </span>

                      <span className="flex items-center gap-1">
                        <Crosshair size={14} />
                        {contract.minBulletsRequired}
                      </span>

                    </div>

                  </div>

                  <div className="flex gap-2">

                    <button
                      className="px-3 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 flex items-center gap-1"
                      onClick={() =>
                        window.location.href =
                          "/intel?target=" +
                          contract.targetNickname
                      }
                    >
                      <Eye size={14} />
                      Intel
                    </button>

                    <button
                      className="px-3 py-1 text-xs bg-[#C6A756] text-black rounded hover:opacity-90 flex items-center gap-1"
                      onClick={() =>
                        window.location.href =
                          "/attack?target=" +
                          contract.targetNickname
                      }
                    >
                      <Crosshair size={14} />
                      Attack
                    </button>

                  </div>

                </div>
              );

            })}

          </div>

        )}

      </div>

      {/* CREATE CONTRACT (MOVED BELOW LIST) */}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-5 space-y-4">

        <h2 className="text-lg font-semibold text-[#C6A756]">
          Create Contract
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input
            placeholder="Target Character ID"
            value={targetCharacterId}
            onChange={(e) => setTargetCharacterId(e.target.value)}
            className="bg-black border border-zinc-700 rounded px-3 py-2 text-sm"
          />

          <input
            type="number"
            value={rewardCash}
            onChange={(e) => setRewardCash(Number(e.target.value))}
            className="bg-black border border-zinc-700 rounded px-3 py-2 text-sm"
          />

          <input
            type="number"
            value={deadlineHours}
            onChange={(e) => setDeadlineHours(Number(e.target.value))}
            className="bg-black border border-zinc-700 rounded px-3 py-2 text-sm"
          />

          <input
            type="number"
            value={minBullets}
            onChange={(e) => setMinBullets(Number(e.target.value))}
            className="bg-black border border-zinc-700 rounded px-3 py-2 text-sm"
          />

        </div>

        <button
          onClick={createContract}
          disabled={submitting}
          className="bg-[#C6A756] text-black px-4 py-2 rounded text-sm font-semibold"
        >
          {submitting ? "Creating..." : "Create Contract"}
        </button>

        {message && (
          <div className="text-sm text-zinc-300">
            {message}
          </div>
        )}

      </div>

    </div>
  );
}
