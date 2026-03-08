"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

type Factory = {
  id: string;
  type: string;
  productionRatePerHour: number;
  lastProductionAt: string;
};

const IMAGE_MAP: Record<string,string> = {
  MINI: "/images/factories/bf-mini.jpg",
  SMALL: "/images/factories/bf-small.jpg",
  MEDIUM: "/images/factories/bf-medium.jpg",
  LARGE: "/images/factories/bf-large.jpg"
};

export default function FactoryManagePage() {

  const [factory, setFactory] = useState<Factory | null>(null);
  const [seconds, setSeconds] = useState<number>(0);

  async function hydrate() {
    const res = await apiFetch("/api/factories");
    setFactory(res.factory ?? null);
  }

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {

    if (!factory) return;

    const interval = setInterval(() => {

      const rate = factory.productionRatePerHour / 60;
      const secondsPerBullet = Math.round(60 / rate);

      const last = new Date(factory.lastProductionAt).getTime();
      const next = last + secondsPerBullet * 1000;

      const diff = Math.max(
        0,
        Math.floor((next - Date.now()) / 1000)
      );

      setSeconds(diff);

    }, 1000);

    return () => clearInterval(interval);

  }, [factory]);

  if (!factory) {

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#C6A756]">
          Factory Control
        </h1>
        <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 text-sm text-zinc-400">
          No factory owned.
        </div>
      </div>
    );
  }

  const leadUsage = factory.productionRatePerHour;
  const cashUsage = factory.productionRatePerHour * 2;
  const perMinute = factory.productionRatePerHour / 60;

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Factory Control
      </h1>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden">

        <div className="w-full aspect-video">
          <img
            src={IMAGE_MAP[factory.type]}
            className="w-full h-full object-cover opacity-80"
          />
        </div>

        <div className="p-6 space-y-4">

          <h2 className="text-lg text-[#C6A756]">
            {factory.type} Factory
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">

            <div>
              <p className="text-zinc-500">Production</p>
              <p className="text-white">
                {factory.productionRatePerHour} bullets/hour
              </p>
            </div>

            <div>
              <p className="text-zinc-500">Lead Consumption</p>
              <p className="text-white">
                {leadUsage}/hour
              </p>
            </div>

            <div>
              <p className="text-zinc-500">Manufacturing Cost</p>
              <p className="text-white">
                ${cashUsage}/hour
              </p>
            </div>

            <div>
              <p className="text-zinc-500">Production Rate</p>
              <p className="text-green-400">
                +{perMinute.toFixed(2)} bullets/min
              </p>
            </div>

          </div>

          <div className="bg-black/40 border border-zinc-700 rounded-lg p-3 text-center text-sm">

            <div className="text-zinc-400">
              Next bullet delivery
            </div>

            <div className="text-[#C6A756] text-lg font-semibold">
              {seconds}s
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
