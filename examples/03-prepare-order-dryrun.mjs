// SIWE login + prepareOrder dry-run on the dreamDEX Perps testnet.
// Uses a THROWAWAY key generated in memory. Prints the unsigned order
// and stops — nothing is submitted on-chain.
// Run: node examples/03-prepare-order-dryrun.mjs
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const API = "https://stg.api.dreamdex.io/v0";
const WS_URL = "wss://stg.api.dreamdex.io/v0/ws/public";

const account = privateKeyToAccount(generatePrivateKey());
console.log("Throwaway wallet:", account.address);

async function req(method, path, body, headers = {}) {
  const r = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.text() };
}

// 1) Get a SIWE nonce, sign the login message, exchange it for a JWT.
const nonceRes = await req("GET", "/auth/nonce");
console.log("GET /auth/nonce ->", nonceRes.status);
const { nonce } = JSON.parse(nonceRes.body);

const message = [
  "stg.api.dreamdex.io wants you to sign in with your Ethereum account:",
  account.address,
  "",
  "Sign in to dreamDEX",
  "",
  "URI: https://stg.api.dreamdex.io",
  "Version: 1",
  "Chain ID: 50383",
  `Nonce: ${nonce}`,
  `Issued At: ${new Date().toISOString()}`,
].join("\n");

const signature = await account.signMessage({ message });
const loginRes = await req("POST", "/auth/login", { message, signature });
console.log("POST /auth/login ->", loginRes.status, loginRes.body.slice(0, 200));
const { token } = JSON.parse(loginRes.body);

// 2) Prepare (do NOT send) a small limit buy and print it.
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
  const prepared = await sendRecv({
    id: 1,
    operation: "prepareOrder",
    bearerToken: token,
    params: {
      symbol: "SOMI:USDso",
      type: "limit",
      side: "buy",
      price: "0.16",
      amount: "1",
      walletAddress: account.address,
      fundingSource: "wallet",
      orderType: "normalOrder",
    },
  });
  console.log("WS prepareOrder ->", JSON.stringify(prepared).slice(0, 1000));
} else {
  console.log("WS did not open; skipping prepareOrder.");
}
ws.close();
console.log("\nDry run only — no transaction was sent.");
