import { create } from "zustand";

interface ResourceState {
  cash: number;
  lead: number;
  energy: number;

  setResources: (r: Partial<ResourceState>) => void;
}

export const useResourceStore = create<ResourceState>((set) => ({
  cash: 0,
  lead: 0,
  energy: 100,

  setResources: (r) =>
    set((state) => ({
      ...state,
      ...r,
    })),
}));
