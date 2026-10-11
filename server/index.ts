/**
 * Onchain Agent — Express backend
 * Serves paid x402 API routes protected by Circle Gateway Nanopayments.
 * Reads VITE_SELLER_ADDRESS from .env (loaded automatically by bun).
 */

import express from 'express'
import { createGatewayMiddleware } from '@circle-fin/x402-batching/server'

const app = express()
app.use(express.json())

const sellerAddress = process.env.VITE_SELLER_ADDRESS
if (!sellerAddress) {
  console.warn('[agent-server] VITE_SELLER_ADDRESS is not set — x402 payment gate will reject all calls')
}

const gateway = createGatewayMiddleware({
  // arc-studio-allow-onchain-literal — zero address placeholder; real seller address comes from VITE_SELLER_ADDRESS env var
  sellerAddress: (sellerAddress ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
})

// Health check (free)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sellerAddress: sellerAddress ?? null })
})

// Paid endpoint: summarize onchain data — $0.01 USDC per call
app.post(
  '/summarize',
  gateway.require('$0.01'),
  async (req, res) => {
    const { topic } = req.body as { topic?: string }
    if (!topic || typeof topic !== 'string') {
      res.status(400).json({ error: 'topic required' })
      return
    }
    // Demo response — replace with real AI / onchain logic
    res.json({
      summary: `Onchain summary for "${topic}": Arc Testnet activity nominal. USDC volume steady.`,
      timestamp: new Date().toISOString(),
    })
  },
)

// Paid endpoint: lookup agent metadata — $0.005 USDC per call
app.get(
  '/agent-meta',
  gateway.require('$0.005'),
  (_req, res) => {
    res.json({
      name: 'Arc Intelligence Agent',
      version: '1.0.0',
      // arc-studio-allow-onchain-literal — Arc Testnet ERC-8004 IdentityRegistry (documented constant from ERC-8004 skill)
      registry: 'eip155:5042002:0x8004A818BFB912233c491871b3d84c89A494BD9e',
      x402Support: true,
    })
  },
)

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`[agent-server] Listening on :${PORT}`)
})
