import { create } from "zustand"

interface CrimeState {
  committing: boolean
  lastResult: any | null
  setCommitting: (v: boolean) => void
  setResult: (r: any) => void
}

export const useCrimeStore = create<CrimeState>((set) => ({
  committing: false,
  lastResult: null,

  setCommitting: (v) =>
    set({
      committing: v
    }),

  setResult: (r) =>
    set({
      lastResult: r
    })
}))
