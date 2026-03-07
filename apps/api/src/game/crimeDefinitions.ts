export const CrimeDefinitions = {
  STREET_THEFT: {
    energyCost: 10,
    cooldownSeconds: 60,
    baseCash: 120,
    baseLeadDropChance: 0.25,
    baseSuccessChance: 0.55,
    skillFocus: "shooting",
    leadLossMax: 1
  },

  BLACK_MARKET_DEAL: {
    energyCost: 15,
    cooldownSeconds: 90,
    baseCash: 220,
    baseLeadDropChance: 0.35,
    baseSuccessChance: 0.55,
    skillFocus: "smuggling",
    leadLossMax: 2
  },

  WAREHOUSE_RAID: {
    energyCost: 25,
    cooldownSeconds: 120,
    baseCash: 400,
    baseLeadDropChance: 0.50,
    baseSuccessChance: 0.48,
    skillFocus: "shooting",
    leadLossMax: 4
  }
} as const;
