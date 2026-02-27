"use client";
import { useEffect, useState } from "react";
import { computeSignals, classifyRegime, marketBreadth, fmtPct, type Ticker } from "@/lib/quant";

interface FundingRow {
  symbol: string;
  binance: number | null;
  bybit: number | null;
}

function fundingColor(v: number | null): string {
  if (v === null) return "bg-zinc-900 text-zinc-700";
  if (v > 100) return "bg-red-900/60 text-red-300";
  if (v > 50) return "bg-orange-900/50 text-orange-300";
  if (v > 20) return "bg-yellow-900/40 text-yellow-300";
  if (v > 0) return "bg-green-900/30 text-green-400";
  return "bg-blue-900/30 text-blue-400";
}

export default function RiskMemoPage() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [funding, setFunding] = useState<FundingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    setGeneratedAt(new Date().toUTCString());
    Promise.all([
      fetch("/api/tickers").then((r) => r.json()),
      fetch("/api/funding").then((r) => r.json()),
    ])
      .then(([t, f]) => {
        if (t.error) throw new Error(t.error);
        setTickers(t);
        if (!f.error) setFunding(f);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const btc = tickers.find((t) => t.symbol === "BTC");
  const regime = btc ? classifyRegime(btc.priceChange1d) : null;
  const breadth = tickers.length > 0 ? marketBreadth(tickers) : null;
  const { longs, shorts } = computeSignals(tickers, 3);

  const crowdedAlerts = tickers
    .filter((t) => t.fundingAnn > 80)
    .sort((a, b) => b.fundingAnn - a.fundingAnn)
    .slice(0, 6);

  const week = getWeekLabel();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Memo header */}
      <div className="mb-8 pb-6 border-b border-zinc-700">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">INTERNAL · RISK MEMO</span>
          <span className="font-mono text-xs text-zinc-600">CONFIDENTIAL</span>
        </div>
        <h1 className="font-mono text-2xl font-bold text-zinc-100 mt-4 mb-1">
          Weekly Risk Memo — {week}
        </h1>
        <div className="font-mono text-xs text-zinc-600 space-y-0.5">
          <p>TO: Portfolio Management, Risk</p>
          <p>FROM: Systematic Strategies</p>
          <p>GENERATED: {generatedAt || "—"}</p>
        </div>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <div className="space-y-8 font-mono">
          {/* 1. Regime */}
          <MemoSection title="1. Regime Classification">
            {regime && btc && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-lg font-bold ${regime.color}`}>{regime.label}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  BTC 1d return: <span className={btc.priceChange1d >= 0 ? "text-green-400" : "text-red-400"}>{fmtPct(btc.priceChange1d)}</span>.{" "}
                  {regime.label === "Risk-On / Trending"
                    ? "Positive price action supports long bias. Monitor for funding overextension as rally matures."
                    : regime.label === "Risk-Off / Drawdown"
                    ? "Negative price action warrants caution on directional longs. Funding typically resets during drawdowns — look for re-entry opportunities."
                    : "BTC is consolidating. Cross-sectional dispersion trades may offer better risk-adjusted returns than directional bets."}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <MemoMetric label="BTC Price" value={`$${btc.price.toLocaleString()}`} />
                  <MemoMetric label="BTC Funding (Ann.)" value={fmtPct(btc.fundingAnn)} />
                </div>
              </>
            )}
          </MemoSection>

          {/* 2. Breadth */}
          <MemoSection title="2. Market Breadth">
            {breadth !== null && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl font-bold text-zinc-100">{breadth.toFixed(0)}%</div>
                  <span className="text-xs text-zinc-500">of alts positive 1d</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${breadth > 60 ? "bg-green-500" : breadth < 40 ? "bg-red-500" : "bg-yellow-500"}`}
                    style={{ width: `${breadth}%` }}
                  />
                </div>
                <p className="text-sm text-zinc-400">
                  {breadth > 70
                    ? "Broad participation — risk-on environment, elevated crowding risk on popular longs."
                    : breadth > 50
                    ? "Moderate breadth — selective exposure warranted. Cross-sectional dispersion high."
                    : breadth > 30
                    ? "Narrow breadth — market leaders diverging from laggards. Factor model conditions improving."
                    : "Very weak breadth — defensive posture recommended. High funding reset risk."}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <MemoMetric label="Universe size" value={`${tickers.length} perps`} />
                  <MemoMetric label="Positive 1d" value={`${Math.round((breadth / 100) * tickers.length)}`} />
                  <MemoMetric label="Negative 1d" value={`${tickers.length - Math.round((breadth / 100) * tickers.length)}`} />
                </div>
              </>
            )}
          </MemoSection>

          {/* 3. Funding Heatmap */}
          <MemoSection title="3. Funding Rate Snapshot">
            <p className="text-xs text-zinc-600 mb-3">Annualised funding rates across venues · cells show Binance / Bybit</p>
            <div className="grid grid-cols-4 gap-1.5">
              {funding.slice(0, 16).map((row) => (
                <div key={row.symbol} className="rounded p-2">
                  <p className="text-xs text-zinc-500 mb-1">{row.symbol}</p>
                  <div className="flex gap-1 flex-wrap">
                    <span className={`text-xs px-1 py-0.5 rounded ${fundingColor(row.binance)}`}>
                      {row.binance !== null ? fmtPct(row.binance, 0) : "—"}
                    </span>
                    <span className={`text-xs px-1 py-0.5 rounded ${fundingColor(row.bybit)}`}>
                      {row.bybit !== null ? fmtPct(row.bybit, 0) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </MemoSection>

          {/* 4. Crowding Alerts */}
          <MemoSection title="4. Crowding Alerts">
            {crowdedAlerts.length === 0 ? (
              <p className="text-sm text-zinc-500">No extreme crowding detected at this time.</p>
            ) : (
              <>
                <p className="text-xs text-zinc-600 mb-3">Symbols with annualised funding &gt;80% — elevated squeeze risk</p>
                <div className="space-y-2">
                  {crowdedAlerts.map((t) => (
                    <div key={t.symbol} className="flex items-center justify-between bg-red-900/10 border border-red-900/30 rounded px-3 py-2">
                      <span className="text-sm text-zinc-100 font-semibold">{t.symbol}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-red-400">{fmtPct(t.fundingAnn)} p.a.</span>
                        <span className="text-xs text-red-600 border border-red-800 px-1.5 py-0.5 rounded">CROWDED</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </MemoSection>

          {/* 5. Dispersion Trade Ideas */}
          <MemoSection title="5. Dispersion Trade Ideas">
            <p className="text-xs text-zinc-600 mb-4">Top cross-sectional pairs from momentum engine · highest signal spread</p>
            {longs.length > 0 && shorts.length > 0 ? (
              <div className="space-y-4">
                {longs.slice(0, 3).map((long, i) => {
                  const short = shorts[i];
                  if (!short) return null;
                  return (
                    <div key={long.symbol} className="border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-zinc-600">IDEA {i + 1}</span>
                        <span className="text-xs text-zinc-700">|</span>
                        <span className="text-xs text-zinc-500">Est. signal spread: {(long.score - short.score).toFixed(2)}σ</span>
                      </div>
                      <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-32">
                          <div className="text-xs text-green-600 mb-1">LONG</div>
                          <div className="text-base text-green-400 font-bold">{long.symbol}</div>
                          <div className="text-xs text-zinc-600 mt-1">
                            Score {long.score.toFixed(2)} · {fmtPct(long.momentum1d)} 1d · {fmtPct(long.fundingAnn)} funding
                          </div>
                        </div>
                        <div className="flex items-center text-zinc-700 text-sm">vs</div>
                        <div className="flex-1 min-w-32">
                          <div className="text-xs text-red-600 mb-1">SHORT</div>
                          <div className="text-base text-red-400 font-bold">{short.symbol}</div>
                          <div className="text-xs text-zinc-600 mt-1">
                            Score {short.score.toFixed(2)} · {fmtPct(short.momentum1d)} 1d · {fmtPct(short.fundingAnn)} funding
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">Insufficient data to generate trade ideas.</p>
            )}
          </MemoSection>

          {/* Disclaimer */}
          <div className="border-t border-zinc-800 pt-6">
            <p className="text-xs text-zinc-700 leading-relaxed">
              This memo is generated programmatically from live market data (Bybit, Binance, CoinGecko) filtered to the top 200 assets by market cap, for demonstration purposes only. It does not constitute financial advice or a solicitation to trade. Past performance of any systematic strategy is not indicative of future results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">{title}</p>
      {children}
    </div>
  );
}

function MemoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2">
      <p className="text-xs text-zinc-600 mb-0.5">{label}</p>
      <p className="text-xs text-zinc-300 font-semibold">{value}</p>
    </div>
  );
}

function getWeekLabel() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1); // Monday
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)} ${now.getFullYear()}`;
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 py-12 text-zinc-500 font-mono text-sm">
      <div className="w-4 h-4 border-2 border-zinc-700 border-t-blue-400 rounded-full animate-spin" />
      Generating memo from live data...
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
