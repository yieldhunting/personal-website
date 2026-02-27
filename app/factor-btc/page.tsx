"use client";
import { useEffect, useState } from "react";
import { fmtVolume, fmtPct } from "@/lib/quant";

interface Ticker {
  symbol: string;
  priceChange1d: number;
  price: number;
  volume24h: number;
  fundingAnn: number;
}

interface CoinData {
  symbol: string;
  fdvMcRatio: number | null;
  priceChange7d: number | null;
}

interface AltShort {
  symbol: string;
  fundingAnn: number;
  priceChange1d: number;
  relStrength: number; // alt 1d - btc 1d
  fdvMcRatio: number | null;
  volume24h: number;
  score: number;
}

export default function FactorBtcPage() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/tickers").then((r) => r.json()),
      fetch("/api/coingecko").then((r) => r.json()),
    ])
      .then(([t, c]) => {
        if (t.error) throw new Error(t.error);
        setTickers(t);
        if (!c.error) setCoins(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const btc = tickers.find((t) => t.symbol === "BTC");
  const btcReturn = btc?.priceChange1d ?? 0;

  // Build coin lookup
  const coinMap: Record<string, CoinData> = {};
  for (const c of coins) coinMap[c.symbol] = c;

  // Screen alt shorts
  const altShorts: AltShort[] = tickers
    .filter((t) => {
      if (t.symbol === "BTC" || t.symbol === "USDT" || t.symbol === "USDC") return false;
      const relStr = t.priceChange1d - btcReturn;
      return (
        t.fundingAnn > 30 &&         // elevated funding
        relStr < -2 &&               // weak vs BTC
        t.volume24h > 20_000_000     // liquid enough
      );
    })
    .map((t) => {
      const coin = coinMap[t.symbol];
      const relStr = t.priceChange1d - btcReturn;
      const fdvMc = coin?.fdvMcRatio ?? null;

      // Composite short score: more negative = stronger short
      let score = 0;
      score += Math.min(t.fundingAnn / 50, 2);      // funding penalty
      score += Math.min(-relStr / 5, 2);             // underperformance
      if (fdvMc && fdvMc > 3) score += 1;            // dilution risk

      return {
        symbol: t.symbol,
        fundingAnn: t.fundingAnn,
        priceChange1d: t.priceChange1d,
        relStrength: relStr,
        fdvMcRatio: fdvMc,
        volume24h: t.volume24h,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <PageHeader
        title="Factor-Driven BTC Long / Alt Short"
        subtitle="Systematic long BTC vs short weak, high-FDV, high-funding alts · Bybit + CoinGecko · top 200 by market cap"
        tag="FACTOR MODEL"
      />

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="space-y-6">
          {/* BTC Long Thesis */}
          {btc && (
            <div className="rounded-xl border border-green-900/50 bg-green-900/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">LONG</span>
                <p className="font-mono text-sm text-green-400 font-semibold">BTC Long Thesis</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricBlock label="Price" value={`$${btc.price.toLocaleString()}`} />
                <MetricBlock label="1d Return" value={fmtPct(btc.priceChange1d)} colored={btc.priceChange1d} />
                <MetricBlock label="Funding (Ann.)" value={fmtPct(btc.fundingAnn)} colored={-btc.fundingAnn} />
                <MetricBlock label="Volume 24h" value={fmtVolume(btc.volume24h)} />
              </div>
              <p className="mt-4 text-xs text-green-700 font-mono">
                {btc.fundingAnn < 20
                  ? "✓ Funding below 20% ann. — market not overcrowded on BTC longs"
                  : btc.fundingAnn < 50
                  ? "△ Moderate funding — BTC longs paying reasonable carry"
                  : "⚠ Elevated funding — BTC long carry is expensive, monitor for flush"}
              </p>
            </div>
          )}

          {/* Alt Short Screen */}
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded">SHORT</span>
                <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">Alt Short Screen</p>
              </div>
              <p className="text-xs text-zinc-600">
                Filter: funding &gt;30% ann. · underperforming BTC by &gt;2% · volume &gt;$20M · ranked by composite score
              </p>
            </div>

            {altShorts.length === 0 ? (
              <div className="px-5 py-8 font-mono text-sm text-zinc-600">
                No alts pass the short screen at current market conditions.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/20">
                    <Th>#</Th>
                    <Th>Symbol</Th>
                    <Th>Funding (Ann.)</Th>
                    <Th>1d Return</Th>
                    <Th>RS vs BTC</Th>
                    <Th>FDV/MC</Th>
                    <Th>Volume 24h</Th>
                    <Th>Score</Th>
                  </tr>
                </thead>
                <tbody>
                  {altShorts.map((a, i) => (
                    <tr key={a.symbol} className={`border-b border-zinc-800/40 ${i % 2 === 0 ? "bg-zinc-900/20" : ""} hover:bg-zinc-900/60`}>
                      <td className="px-4 py-2.5 font-mono text-zinc-600">{i + 1}</td>
                      <td className="px-4 py-2.5 font-mono text-zinc-100 font-semibold">{a.symbol}</td>
                      <td className="px-4 py-2.5 font-mono text-red-400">{fmtPct(a.fundingAnn)}</td>
                      <td className={`px-4 py-2.5 font-mono ${a.priceChange1d >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {fmtPct(a.priceChange1d)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-red-400">{fmtPct(a.relStrength)}</td>
                      <td className={`px-4 py-2.5 font-mono ${a.fdvMcRatio && a.fdvMcRatio > 3 ? "text-orange-400" : "text-zinc-500"}`}>
                        {a.fdvMcRatio !== null ? `${a.fdvMcRatio.toFixed(1)}×` : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-zinc-500">{fmtVolume(a.volume24h)}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-900/40 text-red-400">
                          {a.score.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/20 px-5 py-4">
            <p className="font-mono text-xs text-zinc-600 leading-relaxed">
              <span className="text-zinc-400">Methodology:</span> Alt shorts scored by (1) elevated annualised funding [longs paying to hold], (2) relative underperformance vs BTC [momentum divergence], (3) high FDV/MC ratio [unlock dilution risk]. All alts must pass minimum $20M daily volume filter.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBlock({ label, value, colored }: { label: string; value: string; colored?: number }) {
  const color = colored === undefined ? "text-zinc-100" : colored >= 0 ? "text-green-400" : "text-red-400";
  return (
    <div>
      <p className="font-mono text-xs text-zinc-600 mb-1">{label}</p>
      <p className={`font-mono text-base font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left font-mono text-xs text-zinc-500 uppercase tracking-wider">{children}</th>;
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
      Fetching live market data...
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
