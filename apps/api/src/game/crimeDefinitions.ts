export const CrimeDefinitions = {
  STREET_THEFT: {
    energyCost: 10,
    baseCash: 120,
    baseLeadDropChance: 0.15,
    baseSuccessChance: 0.75,
    skillFocus: "shooting"
  },
  BLACK_MARKET_DEAL: {
    energyCost: 15,
    baseCash: 220,
    baseLeadDropChance: 0.30,
    baseSuccessChance: 0.65,
    skillFocus: "smuggling"
  },
  WAREHOUSE_RAID: {
    energyCost: 25,
    baseCash: 400,
    baseLeadDropChance: 0.45,
    baseSuccessChance: 0.55,
    skillFocus: "shooting"
  }
} as const;
