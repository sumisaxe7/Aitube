// Cross-platform "wait until Postgres accepts TCP connections" — no extra deps.
// Used by `npm run setup` between `db:up` and `db:migrate`.
import net from "node:net";

const HOST = process.env.DB_HOST ?? "127.0.0.1";
const PORT = Number(process.env.DB_PORT ?? 5433);
const TIMEOUT_MS = 60_000;
const start = Date.now();

function canConnect() {
  return new Promise((resolve) => {
    const socket = net.connect(PORT, HOST);
    socket.setTimeout(2000);
    socket.on("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`Waiting for Postgres at ${HOST}:${PORT} ...`);
while (Date.now() - start < TIMEOUT_MS) {
  if (await canConnect()) {
    // Postgres opens the port slightly before it is ready to serve queries.
    await sleep(1500);
    console.log("Postgres is up.");
    process.exit(0);
  }
  await sleep(1000);
}

console.error(`Timed out after ${TIMEOUT_MS / 1000}s waiting for Postgres at ${HOST}:${PORT}.`);
console.error("Is Docker running? Try: npm run db:up");
process.exit(1);
