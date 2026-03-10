const API = "http://localhost:5001";

const BOT_COUNT = 20;
const ATTACKS = 5000;
const CONCURRENCY = 20;
const MAX_BULLETS = 300;

async function spawnBots() {
  console.log("Spawning bots...");

  for (let i = 1; i <= BOT_COUNT; i++) {
    await fetch(`${API}/admin/spawn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: `bot${i}`,
        bullets: 5000
      })
    });
  }

  console.log(`Spawned ${BOT_COUNT} bots`);
}

async function simulateBatch(size) {
  try {
    const res = await fetch(`${API}/admin/simulate-combat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        attacks: size,
        maxBullets: MAX_BULLETS
      })
    });

    const data = await res.json();

    return data.attacksExecuted ?? 0;

  } catch (err) {
    console.log("Batch error:", err.message);
    return 0;
  }
}

async function runSimulation() {

  console.log(`Running ${ATTACKS} attacks`);
  console.log(`Concurrency ${CONCURRENCY}`);

  const batchSize = Math.floor(ATTACKS / CONCURRENCY);

  const workers = [];

  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(simulateBatch(batchSize));
  }

  const results = await Promise.all(workers);

  const total = results.reduce((a, b) => a + b, 0);

  console.log("");
  console.log("Simulation finished");
  console.log("Attacks executed:", total);
}

async function main() {

  console.log("=== GSE Combat Load Test ===");
  console.log("");

  await spawnBots();

  console.log("");

  await runSimulation();

  console.log("");
}

main();
