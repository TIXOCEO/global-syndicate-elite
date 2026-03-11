import Fastify, { FastifyRequest } from "fastify";

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

const app = Fastify({
  logger: true
});

app.post("/internal/state-update", async (req: FastifyRequest) => {
  return { ok: true };
});

app.post("/internal/crime-result", async (req: FastifyRequest) => {
  return { ok: true };
});

app.post("/internal/combat-result", async (req: FastifyRequest) => {
  return { ok: true };
});

app.post("/internal/jail-event", async (req: FastifyRequest) => {
  return { ok: true };
});

app.post("/internal/intel-discovered", async (req: FastifyRequest) => {
  return { ok: true };
});

app.post("/internal/investigation-result", async (req: FastifyRequest) => {
  return { ok: true };
});

/*
Sprint 9 — Hitlist events
*/

app.post("/internal/hitlist-created", async (req: FastifyRequest) => {
  return { ok: true };
});

app.post("/internal/hitlist-completed", async (req: FastifyRequest) => {
  return { ok: true };
});

app.post("/internal/hitlist-cancelled", async (req: FastifyRequest) => {
  return { ok: true };
});

app.post("/internal/hitlist-expired", async (req: FastifyRequest) => {
  return { ok: true };
});

/*
Sprint 10 — Travel events
*/

app.post("/internal/travel-completed", async (req: FastifyRequest) => {
  return { ok: true };
});

app.get("/health/ws", async () => {
  return {
    status: "ok",
    service: "ws"
  };
});

const port = Number(process.env.PORT ?? 5002);

app.listen({
  port,
  host: "0.0.0.0"
}).then(() => {
  console.log(`WS server running on ${port}`);
});

/*
Sprint 10E — Territory capture
*/
app.post("/internal/territory-captured", async (req: FastifyRequest) => {
  return { ok: true };
});
