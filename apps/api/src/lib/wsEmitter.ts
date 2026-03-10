export type CombatResultPayload = {
  attackerId: string;
  defenderId: string;
  damage: number;
  hit: boolean;
  bulletsUsed: number;
  severity?: number;
  recoveryUntil?: number;
  critical?: boolean;
  death?: boolean;
};

const WS_URL = process.env.WS_INTERNAL_URL || "http://127.0.0.1:5002";

export async function emitStateUpdate(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/state-update`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS emit failed", err);
  }
}

export async function emitCrimeResult(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/crime-result`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS emit failed", err);
  }
}

export async function emitCombatResult(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/combat-result`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS emit failed", err);
  }
}

export async function emitJailEvent(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/jail-event`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS jail emit failed", err);
  }
}

export async function emitIntelDiscovered(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/intel-discovered`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS intel emit failed", err);
  }
}

/*
NEW — Sprint 8C Investigation Result
*/
export async function emitInvestigationResult(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/investigation-result`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS investigation emit failed", err);
  }
}
