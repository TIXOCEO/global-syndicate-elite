"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

type HospitalStatusResponse = {
  character: {
    id: string;
    nickname: string;
    hp: number;
    status: string;
    cash: number;
    injurySeverity: number;
    recoveryUntil: number | null;
    recoveryRemainingMs: number;
    medkitCooldownUntil: number | null;
    medkitCooldownRemainingMs: number;
  };
  jail: {
    remaining: number;
  };
  medkit: {
    quantity: number;
    canUse: boolean;
    reason: string | null;
  };
  treatments: Array<{
    type: string;
    name: string;
    reductionPercent: number;
    cost: number;
    enabled: boolean;
    reason: string | null;
  }>;
};

const TREATMENT_IMAGES: Record<string, string> = {
  BASIC_CLINIC: "/images/hospital/hos-basic.jpg",
  PRIVATE_SURGEON: "/images/hospital/hos-private.jpg",
  ELITE_MEDICAL_FACILITY: "/images/hospital/hos-elite.jpg"
};

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

export default function HospitalPage() {
  const [data, setData] = useState<HospitalStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  async function hydrate() {
    try {
      setLoading(true);
      const res = await apiFetch("/api/hospital/status");
      setData(res);
      setError(null);
    } catch {
      setError("Failed to load hospital data");
    } finally {
      setLoading(false);
    }
  }

  async function useTreatment(treatmentType: string) {
    try {
      setActionLoading(treatmentType);
      setError(null);
      setMessage(null);

      await apiFetch("/api/hospital/treat", {
        method: "POST",
        body: JSON.stringify({ treatmentType })
      });

      setMessage("Treatment applied successfully.");
      await hydrate();
    } catch {
      setError("Treatment failed.");
    } finally {
      setActionLoading(null);
    }
  }

  async function useMedkit() {
    try {
      setActionLoading("MEDKIT_I");
      setError(null);
      setMessage(null);

      await apiFetch("/api/hospital/use-medkit", {
        method: "POST",
        body: JSON.stringify({})
      });

      setMessage("Medkit used successfully.");
      await hydrate();
    } catch {
      setError("Medkit use failed.");
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const recoveryRemainingMs = useMemo(() => {
    if (!data?.character.recoveryUntil) return 0;
    return Math.max(0, data.character.recoveryUntil - now);
  }, [data?.character.recoveryUntil, now]);

  const medkitCooldownRemainingMs = useMemo(() => {
    if (!data?.character.medkitCooldownUntil) return 0;
    return Math.max(0, data.character.medkitCooldownUntil - now);
  }, [data?.character.medkitCooldownUntil, now]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#C6A756]">Hospital</h1>
        <div className="text-zinc-400">Loading medical status...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#C6A756]">Hospital</h1>
        <div className="text-red-400">Unable to load hospital data.</div>
      </div>
    );
  }

  const recovering = recoveryRemainingMs > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#C6A756]">Hospital</h1>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#C6A756]">
            Medical Overview
          </h2>
          <span className="text-sm text-zinc-400">{data.character.nickname}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-zinc-400">HP</div>
            <div className="text-white font-semibold">{data.character.hp}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-zinc-400">Cash</div>
            <div className="text-white font-semibold">${data.character.cash}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-zinc-400">Injury Severity</div>
            <div className="text-white font-semibold">
              {data.character.injurySeverity.toFixed(1)}
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-zinc-400">Recovery</div>
            <div className="text-white font-semibold">
              {recovering ? formatRemaining(recoveryRemainingMs) : "Not recovering"}
            </div>
          </div>
        </div>

        {data.jail.remaining > 0 && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            Hospital services unavailable while jailed.
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-[#C6A756]">Medkit I</h2>
          <p className="text-sm text-zinc-400">
            Reduces remaining recovery time by 8%. Cooldown: 2 hours.
          </p>
        </div>

        <div className="p-4 space-y-3">
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
            <img
              src="/images/shop/medkit.jpg"
              alt="Medkit I"
              className="object-cover w-full h-full opacity-80"
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Inventory</span>
            <span className="text-white font-semibold">{data.medkit.quantity}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Cooldown</span>
            <span className="text-white font-semibold">
              {medkitCooldownRemainingMs > 0
                ? formatRemaining(medkitCooldownRemainingMs)
                : "Ready"}
            </span>
          </div>

          {!data.medkit.canUse && (
            <div className="text-sm text-zinc-400">
              {data.medkit.reason ?? "Unavailable"}
            </div>
          )}

          <button
            disabled={!data.medkit.canUse || actionLoading === "MEDKIT_I"}
            onClick={useMedkit}
            className="w-full bg-[#C6A756] text-black py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {actionLoading === "MEDKIT_I" ? "Using..." : "Use Medkit I"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {data.treatments.map((treatment) => (
          <div
            key={treatment.type}
            className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden"
          >
            <div className="w-full aspect-video bg-black relative">
              <img
                src={TREATMENT_IMAGES[treatment.type]}
                alt={treatment.name}
                className="object-cover w-full h-full opacity-80"
              />
            </div>

            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center gap-3">
                <h2 className="text-lg font-semibold text-[#C6A756]">
                  {treatment.name}
                </h2>
                <span className="text-xs text-zinc-400">
                  -{treatment.reductionPercent}% remaining
                </span>
              </div>

              <p className="text-sm text-zinc-400">
                Professional treatment to accelerate recovery.
              </p>

              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Cost</span>
                <span className="text-white font-semibold">${treatment.cost}</span>
              </div>

              {!treatment.enabled && (
                <div className="text-sm text-zinc-400">
                  {treatment.reason ?? "Unavailable"}
                </div>
              )}

              <button
                disabled={!treatment.enabled || actionLoading === treatment.type}
                onClick={() => useTreatment(treatment.type)}
                className="w-full bg-[#C6A756] text-black py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {actionLoading === treatment.type ? "Processing..." : "Receive Treatment"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
