"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const app = (0, fastify_1.default)({
    logger: true
});
app.post("/internal/state-update", async (req) => {
    return { ok: true };
});
app.post("/internal/crime-result", async (req) => {
    return { ok: true };
});
app.post("/internal/combat-result", async (req) => {
    return { ok: true };
});
app.post("/internal/jail-event", async (req) => {
    return { ok: true };
});
app.post("/internal/intel-discovered", async (req) => {
    return { ok: true };
});
app.post("/internal/investigation-result", async (req) => {
    return { ok: true };
});
/*
Sprint 9 — Hitlist events
*/
app.post("/internal/hitlist-created", async (req) => {
    return { ok: true };
});
app.post("/internal/hitlist-completed", async (req) => {
    return { ok: true };
});
app.post("/internal/hitlist-cancelled", async (req) => {
    return { ok: true };
});
app.post("/internal/hitlist-expired", async (req) => {
    return { ok: true };
});
/*
Sprint 10 — Travel events
*/
app.post("/internal/travel-completed", async (req) => {
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
