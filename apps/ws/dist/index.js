"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const server = http_1.default.createServer((req, res) => {
    // health endpoint
    if (req.url === "/health/ws") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "ok", service: "ws" }));
        return;
    }
    // API -> WS event bridge
    if (req.method === "POST" && req.url === "/internal/state-update") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                const payload = JSON.parse(body);
                io.emit("state_update", payload);
                res.writeHead(200);
                res.end("ok");
            }
            catch (err) {
                res.writeHead(400);
                res.end("invalid payload");
            }
        });
        return;
    }
    if (req.method === "POST" && req.url === "/internal/crime-result") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                const payload = JSON.parse(body);
                io.emit("crime_result", payload);
                res.writeHead(200);
                res.end("ok");
            }
            catch (err) {
                res.writeHead(400);
                res.end("invalid payload");
            }
        });
        return;
    }
    res.writeHead(404);
    res.end();
});
const io = new socket_io_1.Server(server, {
    cors: { origin: "*" },
    transports: ["websocket"]
});
io.on("connection", (socket) => {
    console.log("WS client connected:", socket.id);
    socket.emit("connected", {
        ok: true,
        ts: Date.now()
    });
});
const port = Number(process.env.PORT ?? 5002);
server.listen(port, "0.0.0.0", () => {
    console.log(`WS running on port ${port}`);
});
