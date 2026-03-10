"use client";
import { useEffect } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useCharacterStore } from "@/stores/characterStore";
import { useResourceStore } from "@/stores/resourceStore";

export default function ProgressionPage() {

  const setCharacter = useCharacterStore((s) => s.setCharacter);
  const setResources = useResourceStore((s) => s.setResources);

  const { tier, rxp, skills } = useCharacterStore();
  const { energy } = useResourceStore();

  const requiredRXP = Math.round(500 * Math.pow(tier, 1.85));
  const percent = Math.min(100, Math.round((rxp / requiredRXP) * 100));

  function skillPercent(value: number) {
    return Math.min(100, Math.round(value / 5));
  }

  async function hydrate() {

    try {

      const sync = await apiFetch("/api/state/sync");

      setCharacter({
        id: sync.character.id,
        nickname: sync.character.nickname,
        tier: sync.character.tier,
        hp: sync.character.hp,
        notoriety: sync.character.notoriety ?? 0,
        status: sync.character.status,
        rxp: sync.character.rxp,
        skills: {
          shooting: sync.skills?.shooting ?? 0,
          smuggling: sync.skills?.smuggling ?? 0,
          investigation: sync.skills?.investigation ?? 0,
          jailXp: sync.skills?.jailXp ?? 0,
          bustSkillXP: sync.skills?.bustSkillXP ?? 0,
        },
      });

      setResources({
        cash: sync.resources.cash,
        lead: sync.resources.lead,
        energy: sync.resources.energy,
      });

    } catch (err) {

      console.error("Progression hydration failed", err);

    }

  }

  useEffect(() => {
    hydrate();
  }, []);

  return (

    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Progression
      </h1>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-4">

        <div className="flex justify-between items-center">

          <div>
            <h2 className="text-sm text-zinc-400">
              Current Tier
            </h2>
            <p className="text-3xl font-semibold text-[#C6A756]">
              Tier {tier}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-zinc-400">
              Energy
            </p>
            <p className="text-lg font-semibold text-[#C6A756]">
              {energy}
            </p>
          </div>

        </div>

        <div className="space-y-2">

          <div className="flex justify-between text-xs text-zinc-400">
            <span>Rank XP</span>
            <span>{rxp} / {requiredRXP}</span>
          </div>

          <div className="h-3 bg-zinc-800 rounded overflow-hidden">
            <div
              className="h-full bg-[#C6A756] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

        </div>

      </div>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-6">

        <h2 className="text-lg font-semibold text-[#C6A756] mb-1">
          Skills
        </h2>

        {["shooting","smuggling","investigation","jailXp","bustSkillXP"].map((skill)=>{

          const value = (skills as any)[skill] ?? 0;

          const colors:any = {
            shooting:"bg-red-500",
            smuggling:"bg-purple-500",
            investigation:"bg-blue-500",
            jailXp:"bg-orange-400",
            bustSkillXP:"bg-yellow-400"
          };

          const names:any = {
            shooting:"Shooting",
            smuggling:"Smuggling",
            investigation:"Investigation",
            jailXp:"Jail XP",
            bustSkillXP:"Bust Skill"
          };

          return (

            <div key={skill} className="space-y-1">

              <div className="flex justify-between text-xs text-zinc-400">
                <span>{names[skill]}</span>
                <span>{value}</span>
              </div>

              <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                <div
                  className={`h-full ${colors[skill]} transition-all duration-500`}
                  style={{ width: `${skillPercent(value)}%` }}
                />
              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}
