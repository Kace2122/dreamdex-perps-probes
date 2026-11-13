# dreamDEX Perps — testnet probe toolkit

Small Node.js examples built on the dreamDEX Perps API and the
`@somnia-chain/markets-sdk` on the **Somnia Hideki testnet** (chain 50383),
written for the dreamDEX Perps Builder Bounty (Feedback track).

Everything here is read-only or dry-run: the examples list markets, read
public market data, and prepare (but never send) an order. No real funds,
no mainnet, no private keys — the login example generates a throwaway key
in memory.

## Setup

```bash
npm install
```

## Examples

- `examples/01-list-markets.mjs` — list perp markets via the Markets SDK
  (`listPerpMarkets` against the Hideki indexer).
- `examples/02-market-data.mjs` — public market data: aggregate volume
  for one market over a time range (REST), an orderbook snapshot (REST),
  and `getMarkets` over the public WS.
- `examples/03-prepare-order-dryrun.mjs` — SIWE login with a throwaway
  key, then `prepareOrder` for a small testnet order. Prints the unsigned
  order and stops — nothing is submitted on-chain.

Run any of them with `node examples/<file>.mjs`.

## Notes

- Network: Somnia Hideki testnet. Indexer:
  `https://hideki-dev.smk.somnia.host/v1/graphql`, API:
  `https://stg.api.dreamdex.io/v0`, public WS:
  `wss://stg.api.dreamdex.io/v0/ws/public`.
- Testnet funds (USDso/STT) come from the Perps Arena on
  `app.testnet.dreamdex.io`.
- Findings found while building with these scripts are reported through
  the bounty itself, not published here.
