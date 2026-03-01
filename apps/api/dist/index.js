"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const app = (0, fastify_1.default)({
    logger: true
});
app.get("/health/api", async () => {
    return { status: "ok", service: "api" };
});
const port = Number(process.env.PORT ?? 5001);
app.listen({
    port,
    host: "0.0.0.0"
}).then(() => {
    console.log(`API running on port ${port}`);
}).catch((err) => {
    app.log.error(err);
    process.exit(1);
});
