import http from "http";

const server = http.createServer((req, res) => {
  if (req.url === "/health/worker") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "worker" }));
    return;
  }

  res.writeHead(404);
  res.end();
});

setInterval(() => {
  console.log("[worker] heartbeat", new Date().toISOString());
}, 60_000);

const port = Number(process.env.PORT ?? 5003);

server.listen(port, "0.0.0.0", () => {
  console.log(`Worker running on port ${port}`);
});
