/**
 * AgentIdentityCard — registers an ERC-8004 agent identity on Arc Testnet
 * and displays its onchain ID, wallet, and explorer link.
 */

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEventLogs } from 'viem'
import { ExternalLink, CheckCircle, Loader2, AlertCircle, Bot } from 'lucide-react'
import { buildTxExplorerUrl, buildAddressExplorerUrl } from '@/onchain-facts'
import { toast } from 'sonner'

const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const
const ARC_TESTNET_CHAIN_ID = 5042002

const identityAbi = [
  {
    type: 'function' as const,
    name: 'register',
    stateMutability: 'nonpayable' as const,
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'event' as const,
    name: 'Registered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
] as const

interface Props {
  agentUri: string
  agentName: string
  onRegistered: (agentId: bigint, txHash: string) => void
}

export function AgentIdentityCard({ agentUri, agentName, onRegistered }: Props) {
  const { address, chainId } = useAccount()
  const [agentId, setAgentId] = useState<bigint | null>(null)

  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })

  const wrongChain = address && chainId !== ARC_TESTNET_CHAIN_ID

  const handleRegister = () => {
    if (!address) return
    writeContract({
      address: IDENTITY_REGISTRY,
      abi: identityAbi,
      functionName: 'register',
      args: [agentUri],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
  }

  // Parse agentId from receipt once confirmed
  if (isSuccess && receipt && !agentId) {
    try {
      const logs = parseEventLogs({ abi: identityAbi, eventName: 'Registered', logs: receipt.logs })
      if (logs[0]) {
        const id = logs[0].args.agentId
        setAgentId(id)
        onRegistered(id, receipt.transactionHash)
        toast.success(`Agent registered with ID #${id.toString()}`)
      }
    } catch {
      // event parse failed — show tx link anyway
    }
  }

  const explorerTx = hash ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, hash) : null
  const explorerRegistry = buildAddressExplorerUrl(ARC_TESTNET_CHAIN_ID, IDENTITY_REGISTRY)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center">
          <Bot size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--subtle)] font-medium">ERC-8004 Identity</p>
          <h2 className="text-[var(--ink)] font-semibold leading-tight">{agentName}</h2>
        </div>
      </div>

      {/* Agent URI */}
      <div className="rounded-xl bg-white/5 px-4 py-3 space-y-1">
        <p className="text-xs text-[var(--subtle)] uppercase tracking-wider">Agent URI</p>
        <p className="mono text-xs text-[var(--ink-2)] break-all">{agentUri}</p>
      </div>

      {/* Registry */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--muted)]">Identity Registry</span>
        <a
          href={explorerRegistry}
          target="_blank"
          rel="noopener noreferrer"
          className="mono text-xs text-[var(--accent)] flex items-center gap-1 hover:text-[var(--accent-hover)] transition-colors"
        >
          {IDENTITY_REGISTRY.slice(0, 6)}…{IDENTITY_REGISTRY.slice(-4)}
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Status / result */}
      {agentId !== null && (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 px-4 py-3">
          <CheckCircle size={16} className="text-[var(--success)] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[var(--success)] font-semibold text-sm">Registered — Agent #{agentId.toString()}</p>
            {explorerTx && (
              <a
                href={explorerTx}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-xs text-[var(--success)]/70 flex items-center gap-1 mt-0.5 hover:text-[var(--success)] transition-colors"
              >
                {hash?.slice(0, 10)}…{hash?.slice(-6)}
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-2 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 px-4 py-3">
          <AlertCircle size={16} className="text-[var(--danger)] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[var(--danger)] text-sm font-medium">Registration failed</p>
            <p className="text-[var(--danger)]/70 text-xs mt-0.5 break-words">
              {error?.message?.slice(0, 120) ?? 'Unknown error'}
            </p>
            <button
              onClick={reset}
              className="mt-2 text-xs text-[var(--danger)] underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* CTA */}
      {agentId === null && (
        <button
          onClick={handleRegister}
          disabled={!address || isPending || isConfirming || !!wrongChain}
          className="w-full h-11 rounded-xl font-semibold text-sm bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isPending ? (
            <><Loader2 size={15} className="animate-spin" /> Confirm in wallet…</>
          ) : isConfirming ? (
            <><Loader2 size={15} className="animate-spin" /> Confirming…</>
          ) : wrongChain ? (
            'Switch to Arc Testnet'
          ) : !address ? (
            'Connect wallet first'
          ) : (
            'Register Identity'
          )}
        </button>
      )}
    </div>
  )
}
