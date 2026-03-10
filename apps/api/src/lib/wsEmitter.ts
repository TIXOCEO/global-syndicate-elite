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

/*
STATE UPDATE
*/
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

/*
CRIME RESULT
*/
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

/*
COMBAT RESULT
*/
export async function emitCombatResult(payload: CombatResultPayload) {
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

/*
JAIL EVENTS
*/
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

/*
INTEL DISCOVERED
*/
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
INVESTIGATION RESULT
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

/*
SPRINT 9 — HITLIST EVENTS
*/
export async function emitHitlistCreated(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/hitlist-created`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS hitlist created emit failed", err);
  }
}

export async function emitHitlistCancelled(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/hitlist-cancelled`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS hitlist cancelled emit failed", err);
  }
}

export async function emitHitlistCompleted(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/hitlist-completed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS hitlist completed emit failed", err);
  }
}

export async function emitHitlistExpired(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/hitlist-expired`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS hitlist expired emit failed", err);
  }
}

/*
SPRINT 10 — TRAVEL EVENTS
*/
export async function emitTravelCompleted(payload: any) {
  try {
    await fetch(`${WS_URL}/internal/travel-completed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("WS travel emit failed", err);
  }
}
