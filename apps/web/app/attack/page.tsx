"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useCharacterStore } from "@/stores/characterStore";

export default function AttackPage() {

  const { tier } = useCharacterStore();

  const [query,setQuery] = useState("");
  const [results,setResults] = useState<any[]>([]);
  const [target,setTarget] = useState<any>(null);
  const [bullets,setBullets] = useState(10);
  const [result,setResult] = useState<any>(null);

  async function search(q:string){
    setQuery(q);

    if(q.length < 2){
      setResults([]);
      return;
    }

    const res = await apiFetch(`/api/players/search?q=${q}`);
    setResults(res.players);
  }

  async function attack(){

    if(!target) return;

    const res = await apiFetch("/api/combat/attack",{
      method:"POST",
      body:JSON.stringify({
        targetCharacterId:target.id,
        bullets
      })
    });

    setResult(res);

  }

  if(tier < 5){
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#C6A756]">
          Attack
        </h1>

        <div className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden">

          <div className="w-full aspect-video bg-black">
            <img
              src="/images/attack/attack.jpg"
              className="object-cover w-full h-full opacity-80"
            />
          </div>

          <div className="p-6 text-center space-y-3">
            <h2 className="text-lg font-semibold text-[#C6A756]">
              PvP Locked
            </h2>

            <p className="text-sm text-zinc-400">
              Player vs Player combat unlocks at Tier 5.
            </p>

            <p className="text-xs text-zinc-500">
              Continue committing crimes and building your bullet production
              to rise through the ranks.
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (

    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Attack
      </h1>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden">

        <div className="w-full aspect-video bg-black">
          <img
            src="/images/attack/attack.jpg"
            className="object-cover w-full h-full opacity-80"
          />
        </div>

        <div className="p-4 space-y-4">

          <input
            value={query}
            onChange={(e)=>search(e.target.value)}
            placeholder="Search player"
            className="w-full bg-black border border-zinc-700 rounded p-2 text-sm"
          />

          {results.map(p=>(
            <div
              key={p.id}
              onClick={()=>setTarget(p)}
              className="cursor-pointer text-sm text-zinc-300 hover:text-white"
            >
              {p.nickname} (Tier {p.tier})
            </div>
          ))}

          {target && (
            <div className="space-y-2 text-sm">

              <div>Target: {target.nickname}</div>

              <input
                type="range"
                min="1"
                max="500"
                value={bullets}
                onChange={(e)=>setBullets(Number(e.target.value))}
                className="w-full"
              />

              <div>Bullets: {bullets}</div>

              <button
                onClick={attack}
                className="w-full bg-[#C6A756] text-black py-3 rounded-lg font-semibold"
              >
                Attack
              </button>

            </div>
          )}

        </div>

      </div>

      {result && (
        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-4 text-center space-y-2">

          <div className="text-[#C6A756] font-semibold">
            {result.hit ? "HIT" : "MISS"}
          </div>

          <div className="text-sm text-zinc-400">
            Damage: {result.damage}
          </div>

          <div className="text-sm text-zinc-400">
            XP gained: {result.shootXp}
          </div>

        </div>
      )}

    </div>

  );

}
