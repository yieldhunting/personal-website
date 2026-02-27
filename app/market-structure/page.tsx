"use client";
import { useEffect, useState } from "react";
import { fmtVolume, fmtPct } from "@/lib/quant";

interface FundingRow {
  symbol: string;
  binance: number | null;
}

interface TickerRow {
  symbol: string;
  priceChange1d: number;
  volume24h: number;
  fundingAnn: number;
}

function fundingColor(v: number | null): string {
  if (v === null) return "text-zinc-700";
  if (v > 100) return "text-red-400 font-semibold";
  if (v > 50) return "text-orange-400";
  if (v > 20) return "text-yellow-400";
  if (v > 0) return "text-green-400";
  return "text-blue-400";
}

function fundingBg(v: number | null): string {
  if (v === null) return "bg-zinc-900";
  if (v > 100) return "bg-red-900/40";
  if (v > 50) return "bg-orange-900/30";
  if (v > 20) return "bg-yellow-900/20";
  if (v > 0) return "bg-green-900/20";
  return "bg-blue-900/20";
}

export default function MarketStructurePage() {
  const [funding, setFunding] = useState<FundingRow[]>([]);
  const [tickers, setTickers] = useState<TickerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/funding").then((r) => r.json()),
      fetch("/api/tickers").then((r) => r.json()),
    ])
      .then(([f, t]) => {
        if (f.error) throw new Error(f.error);
        setFunding(f);
        setTickers(t);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Crowding: high OI proxy = high funding + large volume
  const crowded = tickers
    .filter((t) => t.fundingAnn > 20 && t.volume24h > 20_000_000)
    .sort((a, b) => b.fundingAnn - a.fundingAnn)
    .slice(0, 10);

  // OI expansion proxy: largest positive 1d movers with high volume
  const oiExpansion = [...tickers]
    .sort((a, b) => b.priceChange1d - a.priceChange1d)
    .slice(0, 12);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        title="Market Structure Monitor"
        subtitle="Funding rates, OI expansion, and crowding risk · Binance · top 200 by market cap"
        tag="MARKET STRUCTURE"
      />

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Funding Heatmap */}
          <Panel title="Funding Heatmap" subtitle="Annualised funding rates (%) · Binance · red = crowded long">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <Th>Symbol</Th>
                    <Th>Binance (Ann.)</Th>
                  </tr>
                </thead>
                <tbody>
                  {funding.map((row, i) => (
                    <tr key={row.symbol} className={`border-b border-zinc-800/40 ${i % 2 === 0 ? "bg-zinc-900/20" : ""}`}>
                      <td className="px-4 py-2 font-mono text-zinc-100 font-semibold">{row.symbol}</td>
                      <td className={`px-4 py-2 font-mono ${fundingColor(row.binance)}`}>
                        <span className={`px-2 py-0.5 rounded ${fundingBg(row.binance)}`}>
                          {row.binance !== null ? fmtPct(row.binance) : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OI Expansion Leaderboard */}
            <Panel title="OI Expansion Leaderboard" subtitle="Top 1d movers — positive price action + volume signals OI growth">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <Th>Symbol</Th>
                    <Th>1d Return</Th>
                    <Th>Volume 24h</Th>
                    <Th>Funding (Ann.)</Th>
                  </tr>
                </thead>
                <tbody>
                  {oiExpansion.map((row, i) => (
                    <tr key={row.symbol} className={`border-b border-zinc-800/40 ${i % 2 === 0 ? "bg-zinc-900/20" : ""}`}>
                      <td className="px-4 py-2 font-mono text-zinc-100 font-semibold">{row.symbol}</td>
                      <td className={`px-4 py-2 font-mono ${row.priceChange1d >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {fmtPct(row.priceChange1d)}
                      </td>
                      <td className="px-4 py-2 font-mono text-zinc-500">{fmtVolume(row.volume24h)}</td>
                      <td className={`px-4 py-2 font-mono ${fundingColor(row.fundingAnn)}`}>
                        {fmtPct(row.fundingAnn)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            {/* Crowding Risk */}
            <Panel title="Crowding Risk" subtitle="Alts with funding &gt;20% ann. — elevated carry, squeeze candidates">
              {crowded.length === 0 ? (
                <p className="font-mono text-sm text-zinc-600 py-4">No crowded positions detected at current thresholds.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <Th>Symbol</Th>
                      <Th>Funding (Ann.)</Th>
                      <Th>Volume 24h</Th>
                      <Th>Risk</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {crowded.map((row, i) => (
                      <tr key={row.symbol} className={`border-b border-zinc-800/40 ${i % 2 === 0 ? "bg-zinc-900/20" : ""}`}>
                        <td className="px-4 py-2 font-mono text-zinc-100 font-semibold">{row.symbol}</td>
                        <td className="px-4 py-2 font-mono text-red-400 font-semibold">{fmtPct(row.fundingAnn)}</td>
                        <td className="px-4 py-2 font-mono text-zinc-500">{fmtVolume(row.volume24h)}</td>
                        <td className="px-4 py-2">
                          <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${row.fundingAnn > 50 ? "bg-red-900/50 text-red-400" : row.fundingAnn > 30 ? "bg-orange-900/40 text-orange-400" : "bg-yellow-900/30 text-yellow-500"}`}>
                            {row.fundingAnn > 50 ? "HIGH" : row.fundingAnn > 30 ? "ELEVATED" : "WATCH"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>

        </div>
      )}
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-0.5">{title}</p>
        <p className="text-xs text-zinc-600">{subtitle}</p>
      </div>
      <div className="p-1">{children}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left font-mono text-xs text-zinc-600 uppercase tracking-wider">{children}</th>;
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
      Fetching live data from Bybit + Binance...
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
