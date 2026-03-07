import { create } from "zustand";

interface ResourceState {
  cash: number;
  lead: number;
  energy: number;
  pulse: boolean;
  setResources: (r: Partial<ResourceState>) => void;
  triggerPulse: () => void;
}

export const useResourceStore = create<ResourceState>((set) => ({
  cash: 0,
  lead: 0,
  energy: 100,
  pulse: false,
  setResources: (r) =>
    set((state) => ({
      ...state,
      ...r,
    })),
  triggerPulse: () =>
    set(() => ({
      pulse: true
    }))
}));
