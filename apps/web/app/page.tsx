"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

import { useAuthStore } from "@/stores/authStore";
import { useCharacterStore } from "@/stores/characterStore";
import { useResourceStore } from "@/stores/resourceStore";

export default function Home() {

  const router = useRouter();

  const setToken = useAuthStore((s) => s.setToken);
  const setCharacter = useCharacterStore((s) => s.setCharacter);
  const setResources = useResourceStore((s) => s.setResources);

  useEffect(() => {

    async function boot() {

      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      setToken(token);

      try {

        const character = await apiFetch("/character/me");

        setCharacter({
          id: character.id,
          nickname: character.nickname,
          tier: character.tier,
          hp: character.hp,
          notoriety: character.notoriety,
          status: character.status
        });

        setResources({
          cash: character.cash,
          lead: character.lead,
          energy: character.energy
        });

        router.push("/dashboard");

      } catch (err) {

        console.error("Boot failed", err);
        router.push("/login");

      }

    }

    boot();

  }, []);

  return null;

}
