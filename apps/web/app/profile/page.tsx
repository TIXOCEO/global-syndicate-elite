"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useCharacterStore } from "@/stores/characterStore";

export default function ProfilePage() {

  const { nickname, tier, notoriety, skills } = useCharacterStore();

  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [eliteCredits, setEliteCredits] = useState(0);
  const [archive, setArchive] = useState<any[]>([]);

  async function hydrate() {
    try {

      const account = await apiFetch("/api/account/me");

      setEmail(account.email);
      setReferralCode(account.referralCode);
      setEliteCredits(account.eliteCredits ?? 0);

      const dead = await apiFetch("/api/character/archive");

      setArchive(dead ?? []);

    } catch (err) {
      console.error("Profile hydration failed", err);
    }
  }

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Profile
      </h1>

      {/* ACCOUNT CARD */}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-3">

        <h2 className="text-lg font-semibold text-[#C6A756]">
          Account
        </h2>

        <div className="text-sm text-zinc-400">
          Email
        </div>

        <div className="text-white">
          {email}
        </div>

        <div className="pt-3 text-sm text-zinc-400">
          Referral Code
        </div>

        <div className="text-white">
          {referralCode}
        </div>

        <div className="pt-3 text-sm text-zinc-400">
          Elite Credits
        </div>

        <div className="text-[#C6A756] font-semibold">
          {eliteCredits}
        </div>

      </div>

      {/* CHARACTER CARD */}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-3">

        <h2 className="text-lg font-semibold text-[#C6A756]">
          Current Operative
        </h2>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <p className="text-xs text-zinc-500">
              Nickname
            </p>
            <p className="text-white">
              {nickname ?? "Unknown"}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Tier
            </p>
            <p className="text-white">
              {tier}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">
              Notoriety
            </p>
            <p className="text-white">
              {notoriety}
            </p>
          </div>

        </div>

      </div>

      {/* SKILLS */}

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 space-y-4">

        <h2 className="text-lg font-semibold text-[#C6A756]">
          Skills
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm">

          <div>
            <p className="text-zinc-500">Shooting</p>
            <p className="text-white">{skills.shooting}</p>
          </div>

          <div>
            <p className="text-zinc-500">Smuggling</p>
            <p className="text-white">{skills.smuggling}</p>
          </div>

          <div>
            <p className="text-zinc-500">Investigation</p>
            <p className="text-white">{skills.investigation}</p>
          </div>

          <div>
            <p className="text-zinc-500">Jail XP</p>
            <p className="text-white">{skills.jailXp}</p>
          </div>

        </div>

      </div>

      {/* DEAD OPERATIVES ARCHIVE */}

      <div className="bg-[#111827] border border-red-500 rounded-xl p-6 space-y-3">

        <h2 className="text-lg font-semibold text-red-400">
          Fallen Operatives
        </h2>

        {archive.length === 0 && (
          <p className="text-sm text-zinc-400">
            No deceased operatives.
          </p>
        )}

        {archive.map((c) => (
          <div
            key={c.id}
            className="flex justify-between text-sm border-b border-zinc-700 pb-2"
          >
            <span>{c.nickname}</span>
            <span className="text-zinc-400">
              Tier {c.tier}
            </span>
          </div>
        ))}

      </div>

    </div>
  );
}
