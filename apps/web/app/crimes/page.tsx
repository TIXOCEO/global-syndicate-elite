"use client";
import { useState, useEffect } from "react";
import { CRIMES } from "@/lib/crimeDefinitions";
import { apiFetch } from "@/lib/apiClient";
import { useResourceStore } from "@/stores/resourceStore";
import { useCrimeStore } from "@/stores/crimeStore";
import { useCharacterStore } from "@/stores/characterStore";

export default function CrimesPage() {

  const { energy, triggerPulse } = useResourceStore();
  const setResources = useResourceStore((s) => s.setResources);
  const setCharacter = useCharacterStore((s) => s.setCharacter);

  const committing = useCrimeStore((s) => s.committing);
  const setCommitting = useCrimeStore((s) => s.setCommitting);
  const setResult = useCrimeStore((s) => s.setResult);
  const setResolverStage = useCrimeStore((s) => s.setResolverStage);

  const [modal, setModal] = useState<any | null>(null);
  const [executionStage, setExecutionStage] = useState<"planning" | "executing" | null>(null);

  const [displayCash, setDisplayCash] = useState(0);
  const [displayLead, setDisplayLead] = useState(0);
  const [displayXP, setDisplayXP] = useState(0);

  const [cooldown, setCooldown] = useState(0);
  const [flash, setFlash] = useState<"success" | "failed" | null>(null);

  async function hydrateState() {

    try {

      const sync = await apiFetch("/api/state/sync");

      setCharacter({
        id: sync.character.id,
        nickname: sync.character.nickname,
        tier: sync.character.tier,
        hp: sync.character.hp,
        notoriety: sync.character.notoriety ?? 0,
        status: sync.character.status
      });

      setResources({
        cash: sync.resources.cash,
        lead: sync.resources.lead,
        energy: sync.resources.energy
      });

      setCooldown(sync.cooldown?.remaining ?? 0);

    } catch (e) {
      console.error("State refresh failed", e);
    }

  }

  async function commitCrime(type: string, energyCost: number) {

    if (energy < energyCost) {
      alert("Not enough energy");
      return;
    }

    try {

      setCommitting(true);

      setResolverStage("planning");
      setExecutionStage("planning");

      await new Promise((r) => setTimeout(r, 700));

      setResolverStage("executing");
      setExecutionStage("executing");

      await new Promise((r) => setTimeout(r, 800));

      const result = await apiFetch("/api/crimes/commit", {
        method: "POST",
        body: JSON.stringify({
          crimeType: type
        })
      });

      setExecutionStage(null);

      setResolverStage("flash");

      setFlash(result.success ? "success" : "failed");

      await new Promise((r) => setTimeout(r, 250));

      setFlash(null);

      setResolverStage("result");

      setResult(result);
      setModal(result);

      triggerPulse();

      await hydrateState();

      if (result.cooldownRemainingSeconds) {
        setCooldown(result.cooldownRemainingSeconds);
      }

    } catch (err: any) {

      setExecutionStage(null);
      alert(err.message);

    } finally {

      setCommitting(false);

    }

  }

  useEffect(() => {
    hydrateState();
  }, []);

  useEffect(() => {

    if (!modal || !modal.success) {
      setDisplayCash(0);
      setDisplayLead(0);
      setDisplayXP(0);
      return;
    }

    let c = 0;
    let l = 0;
    let x = 0;

    const interval = setInterval(() => {

      if (c < modal.cashReward) {
        c += Math.ceil(modal.cashReward / 10);
        if (c > modal.cashReward) c = modal.cashReward;
        setDisplayCash(c);
      }

      if (l < modal.leadReward) {
        l += 1;
        if (l > modal.leadReward) l = modal.leadReward;
        setDisplayLead(l);
      }

      if (x < modal.rxpGain) {
        x += Math.ceil(modal.rxpGain / 10);
        if (x > modal.rxpGain) x = modal.rxpGain;
        setDisplayXP(x);
      }

      if (
        c === modal.cashReward &&
        l === modal.leadReward &&
        x === modal.rxpGain
      ) {
        clearInterval(interval);
      }

    }, 60);

    return () => clearInterval(interval);

  }, [modal]);

  useEffect(() => {

    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);

    return () => clearInterval(timer);

  }, [cooldown]);

  return (

    <div className="space-y-6 relative">

      {flash && (

        <div
          className={`pointer-events-none fixed inset-0 z-50 ${
            flash === "success" ? "bg-white/20" : "bg-red-500/20"
          }`}
        />

      )}

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Crimes
      </h1>

      {cooldown > 0 && (

        <div className="bg-[#111827] border border-[#C6A756] rounded-lg p-3 text-center text-sm text-zinc-300">
          Global cooldown: {cooldown}s
        </div>

      )}

      {CRIMES.map((crime) => (

        <div
          key={crime.key}
          className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden"
        >

          <div className="w-full aspect-video bg-black relative">

            <img
              src={crime.image}
              alt={crime.name}
              className="object-cover w-full h-full opacity-80"
            />

          </div>

          <div className="p-4 space-y-3">

            <div className="flex justify-between items-center">

              <h2 className="text-lg font-semibold text-[#C6A756]">
                {crime.name}
              </h2>

              <span className="text-xs text-zinc-400">
                Energy {crime.energyCost}
              </span>

            </div>

            <p className="text-sm text-zinc-400">
              {crime.description}
            </p>

            <button
              disabled={committing || cooldown > 0}
              onClick={() => commitCrime(crime.key, crime.energyCost)}
              className="w-full bg-[#C6A756] text-black py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-40"
            >
              Commit Crime
            </button>

          </div>

        </div>

      ))}

      {executionStage && (

        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50">

          <div className="text-center space-y-5">

            <div className="text-[#C6A756] text-xl font-semibold animate-pulse">

              {executionStage === "planning"
                ? "Planning Operation"
                : "Executing Operation"}

            </div>

            <div className="w-64 h-2 bg-zinc-800 rounded overflow-hidden">

              <div
                className="h-full bg-[#C6A756] transition-all duration-500"
                style={{
                  width: executionStage === "planning" ? "45%" : "100%"
                }}
              />

            </div>

            <div className="text-xs text-zinc-500">

              {executionStage === "planning"
                ? "Establishing route..."
                : "Resolving outcome..."}

            </div>

          </div>

        </div>

      )}

      {modal && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 w-80 text-center space-y-4">

            <h2 className="text-xl text-[#C6A756] font-semibold">
              {modal.success ? "SUCCESS" : "FAILED"}
            </h2>

            {modal.success && (

              <div className="text-sm space-y-1">

                <div>+$ {displayCash}</div>
                <div>+{displayLead} Lead</div>
                <div>+{displayXP} XP</div>

              </div>

            )}

            {!modal.success && (

              <div className="text-sm text-zinc-400">

                Operation failed
                {modal.hpDamage ? ` • HP -${modal.hpDamage}` : ""}
                {modal.jailed ? ` • Jailed` : ""}

              </div>

            )}

            <button
              onClick={() => setModal(null)}
              className="bg-[#C6A756] text-black px-4 py-2 rounded"
            >
              Continue
            </button>

          </div>

        </div>

      )}

    </div>

  );

}
