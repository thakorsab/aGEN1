/**
 * X402Panel — displays x402 payment endpoints and lets the user probe them.
 * Shows 402 response on an unpaid call, and a paid call is handled server-side.
 */

import { useState } from 'react'
import { Zap, Lock, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'

interface Endpoint {
  method: 'GET' | 'POST'
  path: string
  price: string
  description: string
}

const ENDPOINTS: Endpoint[] = [
  { method: 'POST', path: '/summarize', price: '$0.01', description: 'Summarize onchain activity for a topic' },
  { method: 'GET', path: '/agent-meta', price: '$0.005', description: 'Fetch agent metadata and capabilities' },
]

interface ProbeResult {
  status: number
  body: unknown
}

export function X402Panel() {
  const [results, setResults] = useState<Record<string, ProbeResult | null>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [topic, setTopic] = useState('Arc Testnet governance')

  const probe = async (ep: Endpoint) => {
    const key = ep.path
    setLoading(key)
    setResults(prev => ({ ...prev, [key]: null }))
    try {
      const options: RequestInit = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
      }
      if (ep.method === 'POST') {
        options.body = JSON.stringify({ topic })
      }
      const res = await fetch(`/api${ep.path}`, options)
      const body = (await res.json().catch(() => ({}))) as unknown
      setResults(prev => ({ ...prev, [key]: { status: res.status, body } }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error'
      setResults(prev => ({ ...prev, [key]: { status: 0, body: { error: msg } } }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center">
          <Zap size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--subtle)] font-medium">x402 Payment Gate</p>
          <h2 className="text-[var(--ink)] font-semibold leading-tight">Circle Gateway Nanopayments</h2>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)] text-pretty">
        These endpoints return <span className="mono text-[var(--ink-2)]">HTTP 402 Payment Required</span> until paid via Circle Gateway. An agent client uses <span className="mono text-[var(--ink-2)]">@circle-fin/x402-batching</span> to pay automatically.
      </p>

      {/* Topic input for /summarize */}
      <div className="space-y-1.5">
        <label className="text-xs text-[var(--subtle)] uppercase tracking-wider">Topic (for /summarize)</label>
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="w-full h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-[var(--ink)] text-sm placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)]/50"
          placeholder="e.g. Arc governance proposals"
        />
      </div>

      {/* Endpoints */}
      <div className="space-y-3">
        {ENDPOINTS.map(ep => {
          const key = ep.path
          const result = results[key]
          const busy = loading === key
          const is402 = result?.status === 402
          const isOk = result?.status === 200

          return (
            <div key={key} className="rounded-xl border border-white/8 bg-white/4 p-4 space-y-3">
              {/* Endpoint meta */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    ep.method === 'POST' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="mono text-sm text-[var(--ink-2)] truncate">{ep.path}</span>
                </div>
                <span className="text-xs font-semibold text-[var(--accent)] flex-shrink-0 flex items-center gap-1">
                  <Lock size={10} />
                  {ep.price}
                </span>
              </div>

              <p className="text-xs text-[var(--muted)]">{ep.description}</p>

              {/* Result */}
              {result && (
                <div className={`rounded-lg border text-xs p-3 space-y-1 ${
                  is402 ? 'bg-amber-500/10 border-amber-500/20' :
                  isOk ? 'bg-[var(--success)]/10 border-[var(--success)]/20' :
                  'bg-[var(--danger)]/10 border-[var(--danger)]/20'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {is402 ? <Lock size={11} className="text-amber-400" /> :
                     isOk ? <CheckCircle size={11} className="text-[var(--success)]" /> :
                     <AlertCircle size={11} className="text-[var(--danger)]" />}
                    <span className={`font-bold ${
                      is402 ? 'text-amber-400' :
                      isOk ? 'text-[var(--success)]' :
                      'text-[var(--danger)]'
                    }`}>
                      HTTP {result.status || 'Error'}
                      {is402 && ' — Payment Required'}
                      {isOk && ' — OK'}
                    </span>
                  </div>
                  <pre className="mono text-[var(--muted)] whitespace-pre-wrap break-all text-[11px] max-h-32 overflow-y-auto">
                    {JSON.stringify(result.body, null, 2)}
                  </pre>
                </div>
              )}

              {/* Probe button */}
              <button
                onClick={() => { void probe(ep) }}
                disabled={busy}
                className="w-full h-9 rounded-lg text-xs font-semibold border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? 'Probing…' : 'Probe (unpaid — expect 402)'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Marketplace listing hint */}
      <div className="rounded-xl bg-white/4 border border-white/8 px-4 py-3 flex items-start gap-3">
        <ExternalLink size={14} className="text-[var(--subtle)] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[var(--muted)] text-pretty">
          To list this agent on the Circle marketplace, visit{' '}
          <a
            href="https://agents.circle.com/services"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline"
          >
            agents.circle.com/services
          </a>{' '}
          and submit via the seller intake form.
        </p>
      </div>
    </div>
  )
}
