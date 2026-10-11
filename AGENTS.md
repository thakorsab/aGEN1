# Arc Agent — ERC-8004 + x402

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Onchain agent dashboard with three features:
1. **ERC-8004 identity registration** — registers an agent on Arc Testnet's IdentityRegistry (0x8004A818BFB912233c491871b3d84c89A494BD9e) and displays the assigned agentId.
2. **ERC-8004 reputation** — gives and reads onchain feedback via the ReputationRegistry (0x8004B663056A597Dffe9eCcC1965A193B7388713).
3. **x402 paid API** — an Express backend with Circle Gateway Nanopayment middleware exposes `/summarize` ($0.01) and `/agent-meta` ($0.005) endpoints. The frontend probes them (expects 402 without payment).

## Seller Address

Set `VITE_SELLER_ADDRESS` in `.env` to your EVM address to receive x402 USDC payments.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
