// frontend/src/app/dashboard/page.tsx
'use client'

import { useState } from 'react'
import { ShieldAlert, TrendingUp, Activity, Sliders, ArrowUpRight } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const INITIAL_VALUE = 1_000_000

export default function RiskDashboard() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Configuration state for flexible Monte Carlo
  const [distribution, setDistribution] = useState('student_t')
  const [macroShockBps, setMacroShockBps] = useState(200)
  const [simulations, setSimulations] = useState(10000)
  const [timeHorizonYears, setTimeHorizonYears] = useState(5)

  const handleRunSimulation = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/v1/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulations,
          distribution_model: distribution,
          macro_shock_bps: macroShockBps,
          time_horizon_years: timeHorizonYears,
        }),
      })
      if (!response.ok) {
        throw new Error(`Simulation failed (${response.status})`)
      }
      const data = await response.json()
      setResults(data.metrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SMA Risk & Macro Stress Testing</h1>
          <p className="text-sm text-slate-400">Institutional Monte Carlo Engine & Scenario Analysis</p>
        </div>
        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
        >
          <Activity className="w-4 h-4" />
          {loading ? 'Simulating Paths...' : `Run ${simulations.toLocaleString()} Paths`}
        </button>
      </header>

      {/* Control Panel for Selectable Distributions & Shocks */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" /> Distribution Model
          </label>
          <select 
            value={distribution} 
            onChange={(e) => setDistribution(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="normal">Multivariate Normal</option>
            <option value="student_t">Student’s t-Distribution (Fat Tails)</option>
            <option value="bootstrap">Historical Bootstrap Sampling</option>
          </select>
          <p className="text-xs text-slate-500 mt-2">
            {distribution === 'student_t' ? 'Accounts for market crashes and fat-tailed tail risk.' : 'Assumes standard parametric normality.'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Macro Shock: Yield Curve Shift (bps)
          </label>
          <input 
            type="number" 
            value={macroShockBps} 
            onChange={(e) => setMacroShockBps(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
          <p className="text-xs text-slate-500 mt-2">Injects parallel shifts (e.g., +200 bps) directly into factor matrices.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Path Scale
          </label>
          <select 
            value={simulations} 
            onChange={(e) => setSimulations(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value={5000}>5,000 Paths (Fast)</option>
            <option value={10000}>10,000 Paths (Standard)</option>
            <option value={50000}>50,000 Paths (High Precision)</option>
          </select>
          <p className="text-xs text-slate-500 mt-2">Determines the density of the NumPy vector simulation.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Time Horizon (years)
          </label>
          <select
            value={timeHorizonYears}
            onChange={(e) => setTimeHorizonYears(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value={1}>1 Year</option>
            <option value={5}>5 Years</option>
            <option value={10}>10 Years</option>
            <option value={20}>20 Years</option>
            <option value={30}>30 Years</option>
          </select>
          <p className="text-xs text-slate-500 mt-2">Trading days passed to the Monte Carlo engine.</p>
        </div>
      </div>

      {/* Metrics Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between text-slate-400 text-sm mb-2">
            <span>Median Outcome (P50)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold">${results ? results.p50.toLocaleString() : '1,450,000'}</div>
          <span className="text-xs text-emerald-400 flex items-center mt-1"><ArrowUpRight className="w-3 h-3"/> {results ? `${((results.p50 / INITIAL_VALUE - 1) * 100).toFixed(1)}% projected return` : 'Projected return horizon'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between text-slate-400 text-sm mb-2">
            <span>Tail Risk VaR (95%)</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-semibold text-rose-400">${results ? results.var_95.toLocaleString() : '150,000'}</div>
          <span className="text-xs text-slate-500 mt-1">5th percentile downside threshold</span>
        </div>
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  )
}