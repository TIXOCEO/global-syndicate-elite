export interface CrimeDefinition {
  key: string
  name: string
  description: string
  energyCost: number
  successHint: string
  cashHint: string
  leadHint: string
  image: string
}

export const CRIMES: CrimeDefinition[] = [
  {
    key: "STREET_THEFT",
    name: "Street Theft",
    description: "Quick urban grab targeting distracted civilians.",
    energyCost: 10,
    successHint: "High",
    cashHint: "$100 - $300",
    leadHint: "Low",
    image: "/images/crimes/street_theft.jpg"
  },
  {
    key: "BLACK_MARKET_DEAL",
    name: "Black Market Deal",
    description: "Trade contraband through underground networks.",
    energyCost: 15,
    successHint: "Medium",
    cashHint: "$250 - $600",
    leadHint: "Medium",
    image: "/images/crimes/black_market.jpg"
  },
  {
    key: "WAREHOUSE_RAID",
    name: "Warehouse Raid",
    description: "High risk assault on guarded supply depots.",
    energyCost: 25,
    successHint: "Low",
    cashHint: "$600 - $1400",
    leadHint: "High",
    image: "/images/crimes/warehouse_raid.jpg"
  }
]
