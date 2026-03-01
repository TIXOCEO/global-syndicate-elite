import http from "http";
import { Server } from "socket.io";

const server = http.createServer((req, res) => {
  if (req.url === "/health/ws") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "ws" }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(server, {
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
