"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import Link from "next/link";

type Factory = {
id: string;
type: string;
productionRatePerHour: number;
};

const FACTORIES = [
{
type: "MINI",
name: "Mini Factory",
price: 15000,
production: 15,
description:
"Entry-level ammunition workshop producing small batches of bullets.",
image: "/images/factories/bf-mini.jpg"
},
{
type: "SMALL",
name: "Small Factory",
price: 50000,
production: 30,
description:
"Improved production line capable of doubling bullet output.",
image: "/images/factories/bf-small.jpg"
},
{
type: "MEDIUM",
name: "Medium Factory",
price: 120000,
production: 45,
description:
"Industrial scale production facility supplying steady ammunition.",
image: "/images/factories/bf-medium.jpg"
},
{
type: "LARGE",
name: "Large Factory",
price: 300000,
production: 60,
description:
"High capacity bullet manufacturing complex for large scale warfare.",
image: "/images/factories/bf-large.jpg"
}
];

export default function FactoriesPage() {

const [factory, setFactory] = useState<Factory | null>(null);
const [loading, setLoading] = useState(false);
const [confirmFactory, setConfirmFactory] = useState<any | null>(null);
const [successModal, setSuccessModal] = useState<string | null>(null);

async function hydrate() {
try {
const res = await apiFetch("/api/factories");
setFactory(res.factory ?? null);
} catch (err) {
console.error("Factory load failed", err);
}
}

async function purchase(type: string) {

try {
  setLoading(true);

  await apiFetch("/api/factories/purchase", {
    method: "POST",
    body: JSON.stringify({
      factoryType: type
    })
  });

  await hydrate();

  setSuccessModal(type);

} catch (err) {
  alert("Purchase failed");
} finally {
  setLoading(false);
  setConfirmFactory(null);
}

}

useEffect(() => {
hydrate();
}, []);

return (
<div className="space-y-6">

  <h1 className="text-2xl font-bold text-[#C6A756]">
    Factories
  </h1>

  {FACTORIES.map((f) => {

    const owned = factory?.type === f.type;

    return (
      <div
        key={f.type}
        className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden"
      >

        <div className="w-full aspect-video bg-black relative">
          <img
            src={f.image}
            alt={f.name}
            className="object-cover w-full h-full opacity-80"
          />
        </div>

        <div className="p-4 space-y-3">

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#C6A756]">
              {f.name}
            </h2>

            <span className="text-xs text-zinc-400">
              {f.production} bullets/hr
            </span>
          </div>

          <p className="text-sm text-zinc-400">
            {f.description}
          </p>

          {!owned && (
            <button
              disabled={loading}
              onClick={() => setConfirmFactory(f)}
              className="w-full bg-[#C6A756] text-black py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-40"
            >
              Buy Factory (${f.price})
            </button>
          )}

          {owned && (
            <Link href="/factories/manage">
              <button
                className="w-full bg-[#C6A756] text-black py-3 rounded-lg font-semibold hover:opacity-90"
              >
                Manage
              </button>
            </Link>
          )}

        </div>

      </div>
    );
  })}

  {confirmFactory && (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 w-80 space-y-4 text-center">

        <h2 className="text-lg text-[#C6A756] font-semibold">
          Confirm Purchase
        </h2>

        <p className="text-sm text-zinc-400">
          {factory
            ? "You already own a factory. Buying this will replace it."
            : "Purchase this factory?"}
        </p>

        <p className="text-sm text-white">
          {confirmFactory.name} — ${confirmFactory.price}
        </p>

        <div className="flex gap-3">

          <button
            onClick={() => setConfirmFactory(null)}
            className="flex-1 border border-zinc-600 py-2 rounded text-sm"
          >
            Cancel
          </button>

          <button
            onClick={() => purchase(confirmFactory.type)}
            className="flex-1 bg-[#C6A756] text-black py-2 rounded text-sm font-semibold"
          >
            Confirm
          </button>

        </div>

      </div>

    </div>
  )}

  {successModal && (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 w-80 text-center space-y-4">

        <h2 className="text-lg text-[#C6A756] font-semibold">
          Factory Purchased
        </h2>

        <p className="text-sm text-zinc-400">
          Your {successModal} factory is now operational.
        </p>

        <button
          onClick={() => setSuccessModal(null)}
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
