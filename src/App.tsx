/**
 * Onchain Agent Dashboard
 * - ERC-8004 identity registration on Arc Testnet
 * - ERC-8004 reputation feedback
 * - x402 Gateway Nanopayment endpoint explorer
 */

import { useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { arcTestnet } from 'viem/chains'
import { Bot, RefreshCw } from 'lucide-react'
import { AgentIdentityCard } from './components/AgentIdentityCard'
import { X402Panel } from './components/X402Panel'
import { ReputationPanel } from './components/ReputationPanel'

// ERC-8004 IdentityRegistry on Arc Testnet — documented constant
// arc-studio-allow-onchain-literal
const AGENT_URI =
  'data:application/json;base64,' +
  btoa(
    JSON.stringify({
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: 'Arc Intelligence Agent',
      description: 'Summarizes onchain data and accepts per-call USDC payments via x402',
      services: [{ name: 'A2A', endpoint: 'https://agent.example.com/a2a', version: '0.3.0' }],
      x402Support: true,
      active: true,
      // arc-studio-allow-onchain-literal — Arc Testnet ERC-8004 IdentityRegistry
      supportedTrust: ['reputation'],
    }),
  )

export default function App() {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [registeredId, setRegisteredId] = useState<bigint | null>(null)

  const onArcTestnet = chainId === arcTestnet.id
  const showChainBanner = address && !onArcTestnet

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-5 h-14 border-b border-white/8 backdrop-blur-md bg-[var(--bg)]/60">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-[var(--accent)]" />
          <span className="display font-semibold text-[var(--ink)] tracking-tight">Arc Agent</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium">Testnet</span>
        </div>
        <ConnectKitButton />
      </nav>

      {/* Chain banner */}
      {showChainBanner && (
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
          <p className="text-amber-300 text-sm">Switch to Arc Testnet to register and give feedback.</p>
          <button
            onClick={() => switchChain({ chainId: arcTestnet.id })}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 hover:bg-amber-500/10 transition-colors"
          >
            <RefreshCw size={11} />
            Switch
          </button>
        </div>
      )}

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Hero */}
        <div className="text-center space-y-2 pb-2">
          <h1 className="display text-3xl font-bold text-[var(--ink)]" style={{ letterSpacing: '-0.03em' }}>
            Onchain Agent
          </h1>
          <p className="text-[var(--muted)] text-sm text-pretty max-w-md mx-auto">
            Register an ERC-8004 identity on Arc Testnet, earn a reputation score, and expose paid API endpoints via Circle Gateway x402 Nanopayments.
          </p>
        </div>

        {/* Step 1 — Identity */}
        <div className="space-y-1.5">
          <p className="text-xs text-[var(--subtle)] uppercase tracking-widest px-1">Step 1 — Register Identity</p>
          <AgentIdentityCard
            agentUri={AGENT_URI}
            agentName="Arc Intelligence Agent"
            onRegistered={(id, _hash) => setRegisteredId(id)}
          />
        </div>

        {/* Step 2 — Reputation */}
        <div className="space-y-1.5">
          <p className="text-xs text-[var(--subtle)] uppercase tracking-widest px-1">Step 2 — Reputation Feedback</p>
          <ReputationPanel agentId={registeredId} />
        </div>

        {/* Step 3 — x402 */}
        <div className="space-y-1.5">
          <p className="text-xs text-[var(--subtle)] uppercase tracking-widest px-1">Step 3 — x402 Paid Endpoints</p>
          <X402Panel />
        </div>
      </main>
    </div>
  )
}
