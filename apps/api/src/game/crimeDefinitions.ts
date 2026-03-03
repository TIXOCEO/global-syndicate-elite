export const CrimeDefinitions = {
  STREET_THEFT: {
    energyCost: 10,
    baseCash: 120,
    baseLeadDropChance: 0.25,
    baseSuccessChance: 0.55, // lowered from 0.60
    skillFocus: "shooting"
  },
  BLACK_MARKET_DEAL: {
    energyCost: 15,
    baseCash: 220,
    baseLeadDropChance: 0.35,
    baseSuccessChance: 0.55, // slightly lower
    skillFocus: "smuggling"
  },
  WAREHOUSE_RAID: {
    energyCost: 25,
    baseCash: 400,
    baseLeadDropChance: 0.50,
    baseSuccessChance: 0.48, // slightly lower
    skillFocus: "shooting"
  }
} as const;
