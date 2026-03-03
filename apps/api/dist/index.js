"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const prisma_1 = __importDefault(require("./plugins/prisma"));
const auth_1 = __importDefault(require("./plugins/auth"));
const auth_2 = require("./routes/auth");
const account_1 = require("./routes/account");
const character_1 = require("./routes/character");
const resources_1 = require("./routes/resources");
const crimes_1 = require("./routes/crimes"); // ✅ ADDED
const app = (0, fastify_1.default)({
    logger: true
});
app.register(jwt_1.default, {
    secret: process.env.JWT_ACCESS_SECRET || "dev-secret"
});
app.register(prisma_1.default);
app.register(auth_1.default);
app.register(auth_2.authRoutes);
app.register(account_1.accountRoutes);
app.register(character_1.characterRoutes);
app.register(resources_1.resourceRoutes);
app.register(crimes_1.crimeRoutes); // ✅ ADDED
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
