import { create } from "zustand"

interface CrimeState {
  committing: boolean
  lastResult: any | null
  resolverStage: "idle" | "planning" | "executing" | "flash" | "result"
  setCommitting: (v: boolean) => void
  setResult: (r: any) => void
  setResolverStage: (s: CrimeState["resolverStage"]) => void
}

export const useCrimeStore = create<CrimeState>((set) => ({
  committing: false,
  lastResult: null,
  resolverStage: "idle",
  setCommitting: (v) =>
    set({
      committing: v
    }),
  setResult: (r) =>
    set({
      lastResult: r
    }),
  setResolverStage: (s) =>
    set({
      resolverStage: s
    })
}))
