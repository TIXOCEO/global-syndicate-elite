"use client"

import { useState } from "react"
import { CRIMES } from "@/lib/crimeDefinitions"
import { apiFetch } from "@/lib/apiClient"
import { useResourceStore } from "@/stores/resourceStore"
import { useCrimeStore } from "@/stores/crimeStore"

export default function CrimesPage() {

  const energy = useResourceStore((s) => s.energy)
  const setResources = useResourceStore((s) => s.setResources)

  const committing = useCrimeStore((s) => s.committing)
  const setCommitting = useCrimeStore((s) => s.setCommitting)
  const setResult = useCrimeStore((s) => s.setResult)

  const [modal, setModal] = useState<any | null>(null)

  async function commitCrime(type: string, energyCost: number) {

    if (energy < energyCost) {
      alert("Not enough energy")
      return
    }

    try {

      setCommitting(true)

      const result = await apiFetch("/api/crimes/commit", {
        method: "POST",
        body: JSON.stringify({
          crimeType: type
        })
      })

      setResult(result)
      setModal(result)

      setResources({
        energy: energy - energyCost
      })

    } catch (err: any) {

      alert(err.message)

    } finally {

      setCommitting(false)

    }

  }

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-[#C6A756]">
        Crimes
      </h1>

      {CRIMES.map((crime) => (

        <div
          key={crime.key}
          className="bg-[#111827] border border-[#C6A756] rounded-xl overflow-hidden"
        >

          {/* IMAGE 16:9 */}
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

            <div className="grid grid-cols-3 text-xs text-zinc-400">

              <div>
                <div className="text-zinc-500">Success</div>
                <div>{crime.successHint}</div>
              </div>

              <div>
                <div className="text-zinc-500">Cash</div>
                <div>{crime.cashHint}</div>
              </div>

              <div>
                <div className="text-zinc-500">Lead</div>
                <div>{crime.leadHint}</div>
              </div>

            </div>

            <button
              disabled={committing}
              onClick={() => commitCrime(crime.key, crime.energyCost)}
              className="w-full bg-[#C6A756] text-black py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-40"
            >
              Commit Crime
            </button>

          </div>

        </div>

      ))}

      {/* RESULT MODAL */}

      {modal && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-[#111827] border border-[#C6A756] rounded-xl p-6 w-80 text-center space-y-4">

            <h2 className="text-xl text-[#C6A756] font-semibold">
              {modal.success ? "Success" : "Failed"}
            </h2>

            {modal.success && (
              <div className="text-sm space-y-1">

                <div>Cash +${modal.cashReward}</div>

                <div>Lead +{modal.leadReward}</div>

                <div>XP +{modal.rxpGain}</div>

              </div>
            )}

            {!modal.success && (
              <div className="text-sm text-zinc-400">
                The operation failed.
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
  )
}
