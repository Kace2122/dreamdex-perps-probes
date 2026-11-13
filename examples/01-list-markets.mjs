// List perp markets on the Somnia Hideki testnet via the Markets SDK.
// Read-only. Run: node examples/01-list-markets.mjs
import { listPerpMarkets } from "@somnia-chain/markets-sdk";

const INDEXER = "https://hideki-dev.smk.somnia.host/v1/graphql";

const markets = await listPerpMarkets({ limit: 10 }, INDEXER);
for (const m of markets) {
  console.log(
    `${m.baseSymbol ?? "?"} / ${m.quoteSymbol ?? "?"}  pool=${m.pool ?? m.id}  status=${m.status ?? "?"}`
  );
}
console.log(`\n${markets.length} markets listed (limit 10).`);
