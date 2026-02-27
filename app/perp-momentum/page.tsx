"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { computeSignals, fmtVolume, fmtPct, approximateBtcBeta, type Ticker, type Signal } from "@/lib/quant";

export default function PerpMomentumPage() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"longs" | "shorts">("longs");

  useEffect(() => {
    fetch("/api/tickers")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTickers(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const { longs, shorts } = computeSignals(tickers);
  const btc = tickers.find((t) => t.symbol === "BTC");
  const beta = approximateBtcBeta(tickers);
  const hedgeRatio = beta > 0 ? beta.toFixed(2) : "1.00";

  const chartData = [
    ...longs.slice(0, 8).map((s) => ({ symbol: s.symbol, score: s.score, type: "long" })),
    ...shorts.slice(0, 8).map((s) => ({ symbol: s.symbol, score: s.score, type: "short" })),
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        title="Perp Momentum + Funding Engine"
        subtitle="Cross-sectional long/short strategy · Bybit perpetuals · top 200 by market cap · updated every 60s"
        tag="MOMENTUM"
      />

      {/* BTC snapshot */}
      {btc && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="BTC Price" value={`$${btc.price.toLocaleString()}`} />
          <StatCard label="BTC 1d Return" value={fmtPct(btc.priceChange1d)} positive={btc.priceChange1d} />
          <StatCard label="BTC Funding (Ann.)" value={fmtPct(btc.fundingAnn)} positive={-btc.fundingAnn} />
          <StatCard label="Alt/BTC Beta" value={hedgeRatio} subtitle={`Short ${hedgeRatio} BTC per 100k notional`} />
        </div>
      )}

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          {/* Chart */}
          <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">Signal Distribution · Top Longs vs Shorts</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="symbol" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#e4e4e7" }}
                />
                <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.type === "long" ? "#22c55e" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tables */}
          <div className="flex gap-2 mb-4">
            {(["longs", "shorts"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                  tab === t
                    ? t === "longs" ? "bg-green-900/50 text-green-400 border border-green-800"
                                    : "bg-red-900/50 text-red-400 border border-red-800"
                    : "text-zinc-500 hover:text-zinc-300 border border-zinc-800"
                }`}
              >
                {t === "longs" ? "▲ Longs" : "▼ Shorts"}
              </button>
            ))}
          </div>

          <SignalTable signals={tab === "longs" ? longs : shorts} type={tab === "longs" ? "long" : "short"} />
        </>
      )}
    </div>
  );
}

function SignalTable({ signals, type }: { signals: Signal[]; type: "long" | "short" }) {
  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <Th>Symbol</Th>
            <Th>Price</Th>
            <Th>1d Return</Th>
            <Th>Momentum Z</Th>
            <Th>Funding (Ann.)</Th>
            <Th>Volume 24h</Th>
            <Th>Score</Th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s, i) => (
            <tr key={s.symbol} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? "bg-zinc-900/20" : ""} hover:bg-zinc-900/60 transition-colors`}>
              <td className="px-4 py-2.5 font-mono text-zinc-100 font-semibold text-xs">{s.symbol}</td>
              <td className="px-4 py-2.5 font-mono text-zinc-400 text-xs">${s.price.toLocaleString()}</td>
              <td className={`px-4 py-2.5 font-mono text-xs ${s.momentum1d >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmtPct(s.momentum1d)}
              </td>
              <td className={`px-4 py-2.5 font-mono text-xs ${s.momentumZ >= 0 ? "text-green-400" : "text-red-400"}`}>
                {s.momentumZ.toFixed(2)}
              </td>
              <td className={`px-4 py-2.5 font-mono text-xs ${s.fundingAnn > 0 ? "text-yellow-400" : "text-zinc-400"}`}>
                {fmtPct(s.fundingAnn)}
              </td>
              <td className="px-4 py-2.5 font-mono text-zinc-500 text-xs">{fmtVolume(s.volume24h)}</td>
              <td className="px-4 py-2.5">
                <span
                  className={`font-mono text-xs px-2 py-0.5 rounded ${
                    type === "long"
                      ? "bg-green-900/40 text-green-400"
                      : "bg-red-900/40 text-red-400"
                  }`}
                >
                  {s.score.toFixed(2)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left font-mono text-xs text-zinc-500 uppercase tracking-wider">{children}</th>;
}

function StatCard({ label, value, positive, subtitle }: { label: string; value: string; positive?: number; subtitle?: string }) {
  const color = positive === undefined ? "text-zinc-100" : positive >= 0 ? "text-green-400" : "text-red-400";
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="font-mono text-xs text-zinc-600 mb-1">{label}</p>
      <p className={`font-mono text-lg font-semibold ${color}`}>{value}</p>
      {subtitle && <p className="font-mono text-xs text-zinc-600 mt-1">{subtitle}</p>}
    </div>
  );
}

function PageHeader({ title, subtitle, tag }: { title: string; subtitle: string; tag: string }) {
  return (
    <div className="mb-8">
      <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded mb-3 inline-block">{tag}</span>
      <h1 className="text-3xl font-bold text-zinc-100 mb-2">{title}</h1>
      <p className="text-zinc-500 text-sm">{subtitle}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 py-12 text-zinc-500 font-mono text-sm">
      <div className="w-4 h-4 border-2 border-zinc-700 border-t-blue-400 rounded-full animate-spin" />
      Fetching live data from Bybit...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-900 bg-red-900/10 p-4 font-mono text-sm text-red-400">
      Error: {message}
    </div>
  );
}
