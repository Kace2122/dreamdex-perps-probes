// Public market data on the dreamDEX Perps testnet — read-only.
// 1) Aggregate volume for one market over the last 7 days (REST).
// 2) Orderbook snapshot for one market (REST).
// 3) Public WS: getMarkets.
// Run: node examples/02-market-data.mjs
const API = "https://stg.api.dreamdex.io/v0";
const WS_URL = "wss://stg.api.dreamdex.io/v0/ws/public";
const SYMBOL = "SOMI:USDso";

// --- 1) Aggregate volume, last 7 days (docs: since/until are milliseconds) ---
const until = Date.now() - 30 * 60 * 1000; // 30 minutes ago
const since = until - 7 * 24 * 60 * 60 * 1000; // 7 days before that
const volRes = await fetch(
  `${API}/markets/${encodeURIComponent(SYMBOL)}/volume?since=${since}&until=${until}`
);
console.log("GET /markets/:symbol/volume ->", volRes.status);
console.log((await volRes.text()).slice(0, 500));

// --- 2) Orderbook snapshot (REST, public) ---
const obRes = await fetch(
  `${API}/orderbooks?symbols=${encodeURIComponent(SYMBOL)}`
);
console.log("\nGET /orderbooks ->", obRes.status);
console.log((await obRes.text()).slice(0, 500));

// --- 3) Public WS: ping, then getMarkets ---
const ws = new WebSocket(WS_URL);
const pending = new Map();
ws.addEventListener("message", (event) => {
  let j;
  try {
    j = JSON.parse(event.data);
  } catch {
    return;
  }
  const resolve = pending.get(j.id);
  if (resolve) {
    pending.delete(j.id);
    resolve(j);
  }
});
function sendRecv(obj, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve({ timeout: true }), timeoutMs);
    pending.set(obj.id, (j) => {
      clearTimeout(t);
      resolve(j);
    });
    ws.send(JSON.stringify(obj));
  });
}
await new Promise((resolve) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", resolve, { once: true });
  setTimeout(resolve, 10000);
});
if (ws.readyState === 1) {
  console.log("\nWS getMarkets ->", JSON.stringify(await sendRecv({ id: 2, operation: "getMarkets" })).slice(0, 500));
} else {
  console.log("\nWS did not open; skipping WS part.");
}
ws.close();
