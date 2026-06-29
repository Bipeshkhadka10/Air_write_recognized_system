/**
 * modelStatus.jsx — Real-data ML Status Dashboard
 * Pulls live data from:
 *   GET /predict/health  → model name, num_classes, online/offline
 *   GET /predict/stats   → aggregated Log collection data
 * Auto-refreshes every 30 seconds.
 */

import { useEffect, useState, useCallback } from 'react'
import { FiSearch, FiRefreshCw, FiZap, FiCpu, FiActivity, FiShield } from 'react-icons/fi'
import { User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell,
} from 'recharts'
import api from '../api/axios.js'

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n == null ? '—' : `${n}%`)

const confColor = (v) => {
  if (v == null) return '#94a3b8'
  if (v >= 80)   return '#34d399'   // green
  if (v >= 65)   return '#60a5fa'   // blue
  if (v >= 50)   return '#fbbf24'   // amber
  return '#f87171'                   // red
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

// ── sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent, loading }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        {loading
          ? <div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
          : <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        }
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-slate-700">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value != null ? `${p.value}%` : 'no data'}
        </p>
      ))}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function ModelStatus() {
  const navigate = useNavigate()

  const [health,  setHealth]  = useState(null)   // /predict/health response
  const [stats,   setStats]   = useState(null)   // /predict/stats response
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [hRes, sRes] = await Promise.allSettled([
        api.get('/predict/health', { withCredentials: true }),
        api.get('/predict/stats',  { withCredentials: true }),
      ])

      if (hRes.status === 'fulfilled') setHealth(hRes.value.data)
      else setHealth(null)

      if (sRes.status === 'fulfilled') setStats(sRes.value.data?.data)
      else setStats(null)

      setLastRefresh(new Date())
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 30_000)
    return () => clearInterval(iv)
  }, [fetchData])

  // ── derived values ────────────────────────────────────────────────────────
  const isOnline      = health?.status === 'ok'
  const modelFile     = health?.model   ?? 'Unknown'
  const numClasses    = health?.num_classes ?? '—'
  const imgSize       = health?.img_size ? health.img_size.join('×') : '—'

  const totalPreds    = stats?.totalPredictions ?? 0
  const avgConf       = stats?.avgConfidence    ?? null
  const highRate      = stats?.highConfidenceRate ?? null
  const lowRate       = stats?.lowConfidenceRate  ?? null
  const perChar       = stats?.perCharStats ?? []
  const trend         = stats?.last7Days    ?? []
  const recent        = stats?.recentPredictions ?? []

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── NAV ── */}
      <nav className="h-16 px-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="text-xl font-bold text-slate-900">Model Status</span>
          <p className="text-sm text-slate-800 mt-0.5">Air write performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title="Refresh"
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition">
            <FiRefreshCw size={14} className={loading ? 'animate-spin text-indigo-500' : 'text-slate-500'} />
          </button>

          <User
            onClick={() => navigate('/dashboard/settings')}
            size={20}
            className="text-slate-600 cursor-pointer hover:text-slate-900 transition ml-1"
          />
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">

        {/* ── Error banner ── */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            ⚠ {error}
          </div>
        )}



        {/* ── 4 stat cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FiActivity}
            label="Avg Confidence"
            value={loading ? null : fmt(avgConf)}
            sub={totalPreds ? `across ${totalPreds.toLocaleString()} predictions` : 'No data yet'}
            accent="bg-indigo-50 text-indigo-600"
            loading={loading}
          />
          <StatCard
            icon={FiZap}
            label="High Confidence"
            value={loading ? null : fmt(highRate)}
            sub="Predictions ≥ 65 %"
            accent="bg-emerald-50 text-emerald-600"
            loading={loading}
          />
          <StatCard
            icon={FiShield}
            label="Low Confidence"
            value={loading ? null : fmt(lowRate)}
            sub="Predictions < 65 %"
            accent="bg-amber-50 text-amber-600"
            loading={loading}
          />
          <StatCard
            icon={FiCpu}
            label="Total Predictions"
            value={loading ? null : totalPreds.toLocaleString()}
            sub="From logs (last 500)"
            accent="bg-blue-50 text-blue-600"
            loading={loading}
          />
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* 7-day confidence trend */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900">7-Day Confidence Trend</h2>
            <p className="text-xs text-slate-400 mt-0.5 mb-5">Average prediction confidence per day</p>

            {loading ? (
              <div className="h-64 bg-slate-50 rounded-xl animate-pulse" />
            ) : trend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                No prediction logs yet — start a session to see data here.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="acc"
                      name="Avg conf"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#6366f1' }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Per-character breakdown */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900">Per-Character Confidence</h2>
            <p className="text-xs text-slate-400 mt-0.5 mb-5">Top predicted characters from your logs</p>

            {loading ? (
              <div className="h-64 bg-slate-50 rounded-xl animate-pulse" />
            ) : perChar.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                No predictions logged yet.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perChar} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
                    <XAxis dataKey="ch" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} unit="%" />
                    <Tooltip
                      formatter={(v, _, props) => [`${v}% avg conf (${props.payload.count}×)`, 'Confidence']}
                    />
                    <Bar dataKey="avgConf" radius={[6, 6, 0, 0]}>
                      {perChar.map((d, i) => (
                        <Cell key={i} fill={confColor(d.avgConf)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent predictions table ── */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Recent Predictions</h2>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No predictions yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {/* header */}
              <div className="grid grid-cols-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2">
                <span>Character</span>
                <span>Confidence</span>
                <span className="text-right">Time</span>
              </div>
              {recent.map((r, i) => (
                <div key={i} className="grid grid-cols-3 items-center py-3">
                  <span className="font-mono text-xl font-bold text-slate-800">{r.char}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${r.confidence}%`, background: confColor(r.confidence) }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{r.confidence}%</span>
                  </div>
                  <span className="text-right text-xs text-slate-400">{r.time ? timeAgo(r.time) : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Empty state nudge ── */}
        {!loading && totalPreds === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
            <p className="text-slate-500 font-medium">No prediction logs found.</p>
            <p className="text-sm text-slate-400 mt-1">
              Start a live-writing session and your model's real stats will appear here automatically.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
