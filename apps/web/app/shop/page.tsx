"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export default function ShopPage() {

  const [cash, setCash] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function hydrate() {
    const res = await apiFetch("/api/shop/status");
    setCash(res.cash);
    setQuantity(res.medkit.quantity);
  }

  async function buyMedkit() {
    try {

      setLoading(true);
      setMessage(null);

      await apiFetch("/api/shop/buy-medkit", {
        method: "POST",
        body: JSON.stringify({})
      });

      setMessage("Medkit purchased.");
      await hydrate();

    } catch {
      setMessage("Purchase failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Shop
      </h1>

      <div className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden">

        <div className="w-full aspect-video bg-black relative">
          <img
            src="/images/shop/medkit.jpg"
            alt="Medkit I"
            className="object-cover w-full h-full opacity-80"
          />
        </div>

        <div className="p-4 space-y-3">

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#C6A756]">
              Medkit I
            </h2>

            <span className="text-xs text-zinc-400">
              Recovery item
            </span>
          </div>

          <p className="text-sm text-zinc-400">
            Reduces remaining recovery time by 8%.
          </p>

          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Price</span>
            <span className="text-white font-semibold">$1200</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Inventory</span>
            <span className="text-white font-semibold">{quantity}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Cash</span>
            <span className="text-white font-semibold">${cash}</span>
          </div>

          {message && (
            <div className="text-sm text-zinc-400">
              {message}
            </div>
          )}

          <button
            onClick={buyMedkit}
            disabled={loading || cash < 1200}
            className="w-full bg-[#C6A756] text-black py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Purchasing..." : "Buy Medkit I"}
          </button>

        </div>

      </div>

    </div>
  );
}
