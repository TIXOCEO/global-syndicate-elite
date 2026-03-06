import { create } from "zustand";

interface CharacterState {
  id: string | null;
  nickname: string | null;
  tier: number;
  hp: number;
  notoriety: number;
  status: string | null;

  setCharacter: (c: Partial<CharacterState>) => void;
  clearCharacter: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  id: null,
  nickname: null,
  tier: 1,
  hp: 100,
  notoriety: 0,
  status: null,

  setCharacter: (c) =>
    set((state) => ({
      ...state,
      ...c,
    })),

  clearCharacter: () =>
    set({
      id: null,
      nickname: null,
      tier: 1,
      hp: 100,
      notoriety: 0,
      status: null,
    }),
}));
