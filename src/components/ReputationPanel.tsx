/**
 * ReputationPanel — read and give ERC-8004 reputation feedback for an agent.
 */

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { keccak256, toBytes } from 'viem'
import { Star, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { toast } from 'sonner'

const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const
const ARC_TESTNET_CHAIN_ID = 5042002

const reputationAbi = [
  {
    type: 'function' as const,
    name: 'giveFeedback',
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'value', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function' as const,
    name: 'getSummary',
    stateMutability: 'view' as const,
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'summaryValue', type: 'int128' },
      { name: 'summaryValueDecimals', type: 'uint8' },
    ],
  },
  {
    type: 'function' as const,
    name: 'getClients',
    stateMutability: 'view' as const,
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
] as const

interface Props {
  agentId: bigint | null
}

export function ReputationPanel({ agentId }: Props) {
  const { address, chainId } = useAccount()
  const [score, setScore] = useState(95)
  const [comment, setComment] = useState('')

  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Read existing clients so we can pass them to getSummary
  const { data: clients } = useReadContract(
    agentId !== null ? {
      address: REPUTATION_REGISTRY,
      abi: reputationAbi,
      functionName: 'getClients',
      args: [agentId],
      chainId: ARC_TESTNET_CHAIN_ID,
    } : undefined,
  )

  // Read reputation summary once we have clients
  const { data: summary, refetch: refetchSummary } = useReadContract(
    agentId !== null && clients && clients.length > 0 ? {
      address: REPUTATION_REGISTRY,
      abi: reputationAbi,
      functionName: 'getSummary',
      args: [agentId, clients, '', ''],
      chainId: ARC_TESTNET_CHAIN_ID,
    } : undefined,
  )

  const wrongChain = address && chainId !== ARC_TESTNET_CHAIN_ID

  const handleFeedback = () => {
    if (!address || agentId === null) return
    const body = JSON.stringify({ rating: score, comment })
    writeContract({
      address: REPUTATION_REGISTRY,
      abi: reputationAbi,
      functionName: 'giveFeedback',
      args: [
        agentId,
        BigInt(score),
        0,
        'x402-call',
        '',
        '/summarize',
        '',
        keccak256(toBytes(body)),
      ],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
  }

  if (isSuccess && hash) {
    toast.success('Feedback recorded onchain')
    setTimeout(() => { void refetchSummary() }, 2000)
  }

  const explorerTx = hash ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, hash) : null

  const [count, sumValue] = summary ?? [0n, 0n, 0]
  const avgScore = count && count > 0n ? Math.round(Number(sumValue) / Number(count)) : null

  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center">
          <Star size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--subtle)] font-medium">ERC-8004 Reputation</p>
          <h2 className="text-[var(--ink)] font-semibold leading-tight">Give Feedback</h2>
        </div>
      </div>

      {agentId === null ? (
        <p className="text-sm text-[var(--muted)]">Register the agent identity first to enable reputation.</p>
      ) : (
        <>
          {/* Summary */}
          {clients && clients.length > 0 && summary ? (
            <div className="flex items-center gap-4 rounded-xl bg-white/5 px-4 py-3">
              <div className="text-center">
                <p className="display text-2xl font-bold text-[var(--ink)] tabular-nums">{avgScore ?? '—'}</p>
                <p className="text-xs text-[var(--subtle)]">Avg Score</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <p className="display text-2xl font-bold text-[var(--ink)] tabular-nums">{count?.toString()}</p>
                <p className="text-xs text-[var(--subtle)]">Ratings</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <p className="mono text-xs text-[var(--muted)]">Agent #{agentId.toString()}</p>
                <p className="text-xs text-[var(--subtle)]">Agent ID</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-[var(--muted)]">
              No ratings yet for Agent #{agentId.toString()}
            </div>
          )}

          {/* Score slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--subtle)] uppercase tracking-wider">Score</label>
              <span className="mono text-lg font-bold text-[var(--accent)] tabular-nums">{score}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={e => setScore(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--subtle)] uppercase tracking-wider">Comment (optional)</label>
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-[var(--ink)] text-sm placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)]/50"
              placeholder="e.g. delivered on time"
            />
          </div>

          {/* Success */}
          {isSuccess && explorerTx && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 px-4 py-3">
              <CheckCircle size={15} className="text-[var(--success)]" />
              <a href={explorerTx} target="_blank" rel="noopener noreferrer" className="text-[var(--success)] text-xs hover:underline">
                Feedback recorded — view tx
              </a>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex items-start gap-2 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 px-4 py-3">
              <AlertCircle size={15} className="text-[var(--danger)] mt-0.5" />
              <div>
                <p className="text-[var(--danger)] text-sm">
                  {error?.message?.includes('owner') || error?.message?.includes('cannot')
                    ? 'Owners cannot rate their own agent — use a different wallet.'
                    : error?.message?.slice(0, 100) ?? 'Failed'}
                </p>
                <button onClick={reset} className="text-xs text-[var(--danger)] underline mt-1">Retry</button>
              </div>
            </div>
          )}

          <button
            onClick={handleFeedback}
            disabled={!address || isPending || isConfirming || !!wrongChain}
            className="w-full h-11 rounded-xl font-semibold text-sm bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><Loader2 size={15} className="animate-spin" /> Confirm in wallet…</>
            ) : isConfirming ? (
              <><Loader2 size={15} className="animate-spin" /> Confirming…</>
            ) : wrongChain ? (
              'Switch to Arc Testnet'
            ) : (
              'Submit Feedback Onchain'
            )}
          </button>

          <p className="text-xs text-[var(--subtle)]">
            Note: agent owners cannot rate their own agent (ERC-8004 rule). Use a second wallet to demo the reputation flow.
          </p>
        </>
      )}
    </div>
  )
}
