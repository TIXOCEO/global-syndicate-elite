"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { PlaneTakeoff, Clock, Globe } from "lucide-react";

type Country = {
  id: string;
  name: string;
  code: string;
  borderSecurity: number;
};

export default function AirportPage() {

  const [countries, setCountries] = useState<Country[]>([]);
  const [currentCountry, setCurrentCountry] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [aircraftTier, setAircraftTier] = useState<number>(1);
  const [loading, setLoading] = useState<string | null>(null);

  async function hydrate() {

    try {

      const state = await apiFetch("/api/state/sync");

      setCurrentCountry(state.character.currentCountryId);
      setAircraftTier(state.aircraft?.tier ?? 1);

      setCooldownRemaining(
        Math.floor((state.travel?.remaining ?? 0) / 1000)
      );

      const world = await apiFetch("/api/world/countries");

      setCountries(world.countries);

    } catch (err) {

      console.error("Airport hydration failed", err);

    }

  }

  async function fly(countryId: string) {

    if (cooldownRemaining > 0) return;

    try {

      setLoading(countryId);

      await apiFetch("/api/travel", {
        method: "POST",
        body: JSON.stringify({
          destinationCountryId: countryId
        })
      });

      await hydrate();

    } catch (err) {

      console.error("Travel failed", err);

    } finally {

      setLoading(null);

    }

  }

  useEffect(() => {

    hydrate();

    const interval = setInterval(() => {
      setCooldownRemaining((v) => Math.max(0, v - 1));
    }, 1000);

    return () => clearInterval(interval);

  }, []);

  function formatCooldown(seconds: number) {

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;

  }

  return (

    <div className="max-w-5xl mx-auto px-4 pt-16 pb-20">

      <div className="flex items-center gap-3 mb-6">

        <PlaneTakeoff size={28} className="text-[#C6A756]" />

        <h1 className="text-xl font-semibold text-zinc-200">
          Airport
        </h1>

      </div>

      <div className="bg-[#0B1220] border border-[#C6A756] rounded-xl p-4 mb-6">

        <div className="flex justify-between items-center text-sm text-zinc-300">

          <div className="flex items-center gap-2">
            <Globe size={16} />
            Current Country
          </div>

          <div className="font-semibold text-[#C6A756]">
            {currentCountry}
          </div>

        </div>

        <div className="flex justify-between items-center text-sm text-zinc-300 mt-3">

          <div className="flex items-center gap-2">
            <PlaneTakeoff size={16} />
            Aircraft Tier
          </div>

          <div className="font-semibold">
            Tier {aircraftTier}
          </div>

        </div>

        <div className="flex justify-between items-center text-sm text-zinc-300 mt-3">

          <div className="flex items-center gap-2">
            <Clock size={16} />
            Travel Cooldown
          </div>

          <div className="font-semibold text-orange-400">
            {cooldownRemaining > 0
              ? formatCooldown(cooldownRemaining)
              : "Ready"}
          </div>

        </div>

      </div>

      <div className="space-y-3">

        {countries.map((country) => {

          const isCurrent = country.id === currentCountry;

          return (

            <div
              key={country.id}
              className="bg-[#111827] border border-zinc-800 rounded-lg p-4 flex justify-between items-center"
            >

              <div>

                <div className="text-zinc-200 font-medium">
                  {country.name}
                </div>

                <div className="text-xs text-zinc-500">
                  {country.code}
                </div>

              </div>

              {isCurrent ? (

                <div className="text-xs text-zinc-500">
                  Current Location
                </div>

              ) : (

                <button
                  onClick={() => fly(country.id)}
                  disabled={cooldownRemaining > 0 || loading === country.id}
                  className={`px-4 py-2 rounded text-xs font-semibold transition
                  ${
                    cooldownRemaining > 0
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-[#C6A756] text-black hover:brightness-110"
                  }`}
                >

                  {loading === country.id
                    ? "Flying..."
                    : "Fly"}

                </button>

              )}

            </div>

          );

        })}

      </div>

    </div>

  );
}
