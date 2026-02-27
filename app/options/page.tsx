"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, CartesianGrid,
} from "recharts";
import {
  bsGreeks, computeTermStructure, computeGEX, buildVolSurface,
  SURFACE_MONEYNESS, fmtIV, fmtDelta, fmtGamma, fmtUSD,
  type ParsedOption, type EnrichedOption, type TermPoint, type GEXPoint,
} from "@/lib/options";

// ─── Data fetching ────────────────────────────────────────────────────────────

interface OptionsData {
  spot: number;
  options: ParsedOption[];
  realizedVol: { rv7d: number; rv14d: number; rv30d: number };
  timestamp: string;
}

// ─── Enrich raw options with BS Greeks ────────────────────────────────────────

function enrich(opts: ParsedOption[], spot: number): EnrichedOption[] {
  return opts.map((o) => {
    const T = o.daysToExpiry / 365;
    const { delta, gamma, vega, theta } = bsGreeks(spot, o.strike, T, o.markIV, o.type);
    return { ...o, delta, gamma, vega, theta, openInterestUSD: o.openInterest * spot };
  });
}

// ─── IV heatmap colouring ────────────────────────────────────────────────────

function ivCellClass(iv: number | null): string {
  if (iv === null) return "bg-zinc-900/40 text-zinc-700";
  if (iv < 30) return "bg-blue-900/50 text-blue-300";
  if (iv < 50) return "bg-teal-900/40 text-teal-300";
  if (iv < 70) return "bg-green-900/40 text-green-300";
  if (iv < 90) return "bg-yellow-900/40 text-yellow-300";
  if (iv < 120) return "bg-orange-900/40 text-orange-300";
  return "bg-red-900/50 text-red-300";
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ["Vol Surface", "Term Structure & Skew", "Gamma Exposure", "Screener", "Vol Risk Premium"] as const;
type Tab = (typeof TABS)[number];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OptionsPage() {
  const [data, setData] = useState<OptionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("Vol Surface");

  useEffect(() => {
    fetch("/api/options")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const enriched = useMemo(
    () => (data ? enrich(data.options, data.spot) : []),
    [data]
  );

  const termStructure = useMemo(() => computeTermStructure(enriched, data?.spot ?? 0), [enriched, data]);
  const gexPoints = useMemo(() => computeGEX(enriched, data?.spot ?? 0), [enriched, data]);

  // Vol surface: nearest 6 expiries
  const surfaceExpiries = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const o of [...enriched].sort((a, b) => a.daysToExpiry - b.daysToExpiry)) {
      if (!seen.has(o.expiry)) { seen.add(o.expiry); out.push(o.expiry); }
      if (out.length === 6) break;
    }
    return out;
  }, [enriched]);

  const volSurface = useMemo(
    () => (data ? buildVolSurface(enriched, surfaceExpiries) : {}),
    [enriched, surfaceExpiries, data]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded mb-3 inline-block">
          OPTIONS · LIVE · DERIBIT
        </span>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">BTC Options Intelligence</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-zinc-500 text-sm">
            Vol surface · term structure · GEX · screener · vol risk premium · updated every 2 min
          </p>
          {data?.spot && (
            <span className="font-mono text-xs text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded">
              BTC spot: ${data.spot.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 flex-wrap border-b border-zinc-800 pb-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-t transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-blue-400 text-blue-400 bg-blue-400/5"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <LoadingState text="Fetching BTC options from Deribit..." />}
      {error && <ErrorState message={error} />}

      {!loading && !error && data && (
        <>
          {tab === "Vol Surface" && (
            <VolSurfaceTab
              volSurface={volSurface}
              expiries={surfaceExpiries}
              enriched={enriched}
              spot={data.spot}
            />
          )}
          {tab === "Term Structure & Skew" && (
            <TermStructureTab termStructure={termStructure} />
          )}
          {tab === "Gamma Exposure" && (
            <GEXTab gexPoints={gexPoints} spot={data.spot} />
          )}
          {tab === "Screener" && (
            <ScreenerTab enriched={enriched} spot={data.spot} />
          )}
          {tab === "Vol Risk Premium" && (
            <VRPTab rv={data.realizedVol} termStructure={termStructure} spot={data.spot} />
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab: Vol Surface ─────────────────────────────────────────────────────────

function VolSurfaceTab({
  volSurface, expiries, enriched, spot,
}: {
  volSurface: Record<number, Record<string, number | null>>;
  expiries: string[];
  enriched: EnrichedOption[];
  spot: number;
}) {
  return (
    <div className="space-y-6">
      <Panel
        title="Implied Volatility Surface"
        subtitle="BTC options · IV by strike (moneyness) × expiry · OTM puts left, OTM calls right · convention: put IV below spot, call IV above"
      >
        <div className="overflow-x-auto">
          <table className="text-xs font-mono w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-3 py-2 text-left text-zinc-600 w-24">Strike</th>
                {expiries.map((e) => (
                  <th key={e} className="px-3 py-2 text-center text-zinc-500">{e}</th>
                ))}
              </tr>
              <tr className="border-b border-zinc-800/50">
                <th className="px-3 py-1 text-left text-zinc-700 text-xs">Moneyness</th>
                {expiries.map((e) => {
                  const dte = enriched.find((o) => o.expiry === e)?.daysToExpiry;
                  return (
                    <th key={e} className="px-3 py-1 text-center text-zinc-700">
                      {dte != null ? `${dte}d` : ""}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[...SURFACE_MONEYNESS].reverse().map((m) => {
                const strikeApprox = Math.round(m * spot / 500) * 500;
                const isATM = m === 1.00;
                return (
                  <tr
                    key={m}
                    className={`border-b border-zinc-800/30 ${isATM ? "border-zinc-600" : ""}`}
                  >
                    <td className={`px-3 py-2 ${isATM ? "text-zinc-200 font-semibold" : "text-zinc-500"}`}>
                      {m.toFixed(2)}×
                      <span className="block text-zinc-700 text-xs">~${(strikeApprox).toLocaleString()}</span>
                    </td>
                    {expiries.map((e) => {
                      const iv = volSurface[m]?.[e] ?? null;
                      return (
                        <td key={e} className={`px-3 py-2 text-center rounded ${ivCellClass(iv)}`}>
                          {fmtIV(iv)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex gap-3 mt-4 px-3 pb-2 flex-wrap">
          {[
            { label: "<30%", cls: "bg-blue-900/50 text-blue-300" },
            { label: "30–50%", cls: "bg-teal-900/40 text-teal-300" },
            { label: "50–70%", cls: "bg-green-900/40 text-green-300" },
            { label: "70–90%", cls: "bg-yellow-900/40 text-yellow-300" },
            { label: "90–120%", cls: "bg-orange-900/40 text-orange-300" },
            { label: ">120%", cls: "bg-red-900/50 text-red-300" },
          ].map((l) => (
            <span key={l.label} className={`font-mono text-xs px-2 py-0.5 rounded ${l.cls}`}>
              {l.label}
            </span>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ─── Tab: Term Structure & Skew ────────────────────────────────────────────────

function TermStructureTab({ termStructure }: { termStructure: TermPoint[] }) {
  const skewData = termStructure.filter((p) => p.skew25d !== null);

  return (
    <div className="space-y-6">
      <Panel
        title="ATM Term Structure"
        subtitle="At-the-money implied volatility (%) by days to expiry · upward slope = term premium, inversion = short-dated stress"
      >
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={termStructure} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="dte"
              type="category"
              tickFormatter={(v) => `${v}d`}
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Days to Expiry", position: "insideBottom", offset: -2, fontSize: 10, fill: "#52525b" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}%`, "ATM IV"]}
              labelFormatter={(l) => `${l}d`}
            />
            <Line
              type="monotone"
              dataKey="atmIV"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800">
                <Th>Expiry</Th><Th>DTE</Th><Th>ATM IV</Th><Th>25Δ Skew</Th><Th>Interpretation</Th>
              </tr>
            </thead>
            <tbody>
              {termStructure.map((p, i) => (
                <tr key={p.expiry} className={`border-b border-zinc-800/40 ${i % 2 === 0 ? "bg-zinc-900/20" : ""}`}>
                  <td className="px-4 py-2 text-zinc-100">{p.expiry}</td>
                  <td className="px-4 py-2 text-zinc-500">{p.dte}d</td>
                  <td className="px-4 py-2 text-blue-400">{fmtIV(p.atmIV)}</td>
                  <td className={`px-4 py-2 ${(p.skew25d ?? 0) > 5 ? "text-red-400" : (p.skew25d ?? 0) < -2 ? "text-green-400" : "text-zinc-400"}`}>
                    {p.skew25d !== null ? `${p.skew25d > 0 ? "+" : ""}${p.skew25d.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {p.skew25d === null ? "—"
                      : p.skew25d > 8 ? "Strong put skew · downside fear"
                      : p.skew25d > 3 ? "Moderate put skew"
                      : p.skew25d < 0 ? "Call skew · upside demand"
                      : "Neutral skew"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {skewData.length > 0 && (
        <Panel
          title="25-Delta Risk Reversal"
          subtitle="Put IV minus call IV at same delta · positive = market paying up for downside protection, negative = call skew / upside demand"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={skewData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="expiry" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(2)}%`, "25Δ Skew (Put − Call)"]}
              />
              <ReferenceLine y={0} stroke="#3f3f46" />
              <Bar dataKey="skew25d" radius={[3, 3, 0, 0]}>
                {skewData.map((entry, i) => (
                  <Cell key={i} fill={(entry.skew25d ?? 0) >= 0 ? "#ef4444" : "#22c55e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}
    </div>
  );
}

// ─── Tab: Gamma Exposure ──────────────────────────────────────────────────────

function GEXTab({ gexPoints, spot }: { gexPoints: GEXPoint[]; spot: number }) {
  // Find gamma flip (where cumulative GEX changes sign)
  let flipStrike: number | null = null;
  for (let i = 1; i < gexPoints.length; i++) {
    if (
      gexPoints[i - 1].cumGex * gexPoints[i].cumGex < 0 ||
      (gexPoints[i - 1].cumGex >= 0 && gexPoints[i].cumGex < 0)
    ) {
      flipStrike = Math.round((gexPoints[i - 1].strike + gexPoints[i].strike) / 2);
      break;
    }
  }

  const maxAbsGex = Math.max(...gexPoints.map((p) => Math.abs(p.gex)));
  const nearSpot = gexPoints.filter(
    (p) => p.strike >= spot * 0.75 && p.strike <= spot * 1.25
  );

  const totalGex = gexPoints.reduce((a, b) => a + b.gex, 0);
  const positive = gexPoints.filter((p) => p.gex > 0);
  const largestPin = positive.sort((a, b) => b.gex - a.gex)[0];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Net Market GEX" value={fmtUSD(totalGex)} subtitle={totalGex > 0 ? "Dealers net long γ" : "Dealers net short γ"} />
        <StatCard label="Gamma Flip" value={flipStrike ? `$${flipStrike.toLocaleString()}` : "N/A"} subtitle="Below = short-γ regime" />
        <StatCard label="Largest Pin" value={largestPin ? `$${largestPin.strike.toLocaleString()}` : "—"} subtitle={largestPin ? fmtUSD(largestPin.gex) : ""} />
        <StatCard label="BTC Spot" value={`$${spot.toLocaleString()}`} subtitle={flipStrike ? (spot > flipStrike ? "Above flip · pinning" : "Below flip · explosive") : ""} />
      </div>

      <Panel
        title="Gamma Exposure by Strike"
        subtitle="Net dealer GEX (USD) per strike · green = long gamma (pinning) · red = short gamma (explosive moves) · spot and flip point marked"
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={nearSpot} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="strike"
              tick={{ fontSize: 9, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => fmtUSD(v)}
            />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number | undefined) => [fmtUSD(v ?? 0), "Net GEX"]}
              labelFormatter={(l) => `Strike: $${Number(l).toLocaleString()}`}
            />
            {flipStrike && (
              <ReferenceLine
                x={flipStrike}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: "Flip", position: "top", fill: "#f59e0b", fontSize: 10 }}
              />
            )}
            <ReferenceLine
              x={Math.round(spot / 500) * 500}
              stroke="#3b82f6"
              strokeDasharray="4 4"
              label={{ value: "Spot", position: "top", fill: "#3b82f6", fontSize: 10 }}
            />
            <Bar dataKey="gex" radius={[2, 2, 0, 0]} maxBarSize={30}>
              {nearSpot.map((entry, i) => (
                <Cell key={i} fill={entry.gex >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 px-4 pb-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono text-zinc-500">
          <p>
            <span className="text-green-400">Green bars</span>: dealers net long gamma → they buy dips, sell rips → price gravitates toward these strikes (pinning)
          </p>
          <p>
            <span className="text-red-400">Red bars</span>: dealers net short gamma → they chase moves → price can run freely away from these strikes
          </p>
        </div>
      </Panel>
    </div>
  );
}

// ─── Tab: Options Screener ─────────────────────────────────────────────────────

type SortKey = "openInterest" | "markIV" | "volume24h" | "daysToExpiry" | "delta";

function ScreenerTab({ enriched, spot }: { enriched: EnrichedOption[]; spot: number }) {
  const [typeFilter, setTypeFilter] = useState<"ALL" | "C" | "P">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("openInterest");
  const [sortAsc, setSortAsc] = useState(false);
  const [minOI, setMinOI] = useState(0);

  const sorted = useMemo(() => {
    let rows = enriched.filter((o) => {
      if (typeFilter !== "ALL" && o.type !== typeFilter) return false;
      if (o.openInterest < minOI) return false;
      return true;
    });
    rows.sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortAsc ? diff : -diff;
    });
    return rows.slice(0, 150);
  }, [enriched, typeFilter, sortKey, sortAsc, minOI]);

  function SortTh({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <th
        className={`px-3 py-2.5 text-left font-mono text-xs uppercase tracking-wider cursor-pointer select-none whitespace-nowrap ${active ? "text-blue-400" : "text-zinc-600 hover:text-zinc-400"}`}
        onClick={() => { if (active) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(false); } }}
      >
        {label} {active ? (sortAsc ? "↑" : "↓") : ""}
      </th>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {(["ALL", "C", "P"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors border ${
                typeFilter === f ? "bg-zinc-800 text-zinc-100 border-zinc-600" : "text-zinc-500 border-zinc-800 hover:text-zinc-300"
              }`}
            >
              {f === "ALL" ? "All" : f === "C" ? "Calls" : "Puts"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <span>Min OI (BTC):</span>
          {[0, 1, 5, 10, 50].map((v) => (
            <button
              key={v}
              onClick={() => setMinOI(v)}
              className={`px-2 py-1 rounded border transition-colors ${
                minOI === v ? "bg-zinc-800 text-zinc-200 border-zinc-600" : "text-zinc-600 border-zinc-800 hover:text-zinc-400"
              }`}
            >
              {v === 0 ? "Any" : `≥${v}`}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs text-zinc-600 ml-auto">{sorted.length} options</span>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-3 py-2.5 text-left font-mono text-xs text-zinc-600">Type</th>
                <SortTh label="Strike" k="openInterest" />
                <th className="px-3 py-2.5 text-left font-mono text-xs text-zinc-600 uppercase tracking-wider">Expiry</th>
                <SortTh label="DTE" k="daysToExpiry" />
                <SortTh label="Mark IV" k="markIV" />
                <SortTh label="Delta" k="delta" />
                <th className="px-3 py-2.5 text-left font-mono text-xs text-zinc-600 uppercase tracking-wider">Gamma</th>
                <th className="px-3 py-2.5 text-left font-mono text-xs text-zinc-600 uppercase tracking-wider">Theta/d</th>
                <SortTh label="OI (BTC)" k="openInterest" />
                <th className="px-3 py-2.5 text-left font-mono text-xs text-zinc-600 uppercase tracking-wider">OI (USD)</th>
                <SortTh label="Vol 24h" k="volume24h" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((o, i) => (
                <tr
                  key={o.instrument}
                  className={`border-b border-zinc-800/40 ${i % 2 === 0 ? "bg-zinc-900/20" : ""} hover:bg-zinc-900/50 transition-colors`}
                >
                  <td className="px-3 py-2">
                    <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${o.type === "C" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                      {o.type === "C" ? "CALL" : "PUT"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-100 font-semibold">
                    ${o.strike.toLocaleString()}
                    <span className={`ml-1 text-xs ${o.moneyness > 1.02 ? "text-green-700" : o.moneyness < 0.98 ? "text-red-700" : "text-blue-600"}`}>
                      {o.moneyness > 1.02 ? "OTM" : o.moneyness < 0.98 ? "OTM" : "ATM"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-500">{o.expiry}</td>
                  <td className="px-3 py-2 font-mono text-zinc-500">{o.daysToExpiry}d</td>
                  <td className="px-3 py-2 font-mono text-yellow-400">{fmtIV(o.markIV)}</td>
                  <td className={`px-3 py-2 font-mono ${Math.abs(o.delta) > 0.4 && Math.abs(o.delta) < 0.6 ? "text-blue-400" : "text-zinc-400"}`}>
                    {fmtDelta(o.delta)}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-600">{fmtGamma(o.gamma)}</td>
                  <td className="px-3 py-2 font-mono text-red-500">{o.theta.toFixed(2)}</td>
                  <td className="px-3 py-2 font-mono text-zinc-300">{o.openInterest.toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono text-zinc-500">{fmtUSD(o.openInterestUSD)}</td>
                  <td className="px-3 py-2 font-mono text-zinc-600">{o.volume24h.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Vol Risk Premium ────────────────────────────────────────────────────

function VRPTab({
  rv,
  termStructure,
  spot,
}: {
  rv: { rv7d: number; rv14d: number; rv30d: number };
  termStructure: TermPoint[];
  spot: number;
}) {
  // Find nearest IV for each RV window
  const iv7 = termStructure.find((p) => p.dte >= 5 && p.dte <= 10)?.atmIV
    ?? termStructure[0]?.atmIV ?? 0;
  const iv14 = termStructure.find((p) => p.dte >= 12 && p.dte <= 18)?.atmIV
    ?? termStructure[0]?.atmIV ?? 0;
  const iv30 = termStructure.find((p) => p.dte >= 25 && p.dte <= 35)?.atmIV
    ?? termStructure[1]?.atmIV ?? 0;

  const vrp7 = iv7 - rv.rv7d;
  const vrp14 = iv14 - rv.rv14d;
  const vrp30 = iv30 - rv.rv30d;

  const barData = [
    { label: "7d", iv: iv7, rv: rv.rv7d, vrp: vrp7 },
    { label: "14d", iv: iv14, rv: rv.rv14d, vrp: vrp14 },
    { label: "30d", iv: iv30, rv: rv.rv30d, vrp: vrp30 },
  ];

  function signal(vrp: number): { text: string; color: string } {
    if (vrp > 15) return { text: "VOL RICH — options expensive, consider selling vol", color: "text-red-400" };
    if (vrp > 5) return { text: "Slight vol premium — options moderately priced", color: "text-orange-400" };
    if (vrp > -5) return { text: "Neutral — IV roughly in line with realised vol", color: "text-zinc-400" };
    return { text: "VOL CHEAP — options historically cheap, consider buying vol", color: "text-green-400" };
  }

  const avgVRP = (vrp7 + vrp14 + vrp30) / 3;
  const sig = signal(avgVRP);

  return (
    <div className="space-y-6">
      {/* Signal banner */}
      <div className={`rounded-xl border px-5 py-4 ${avgVRP > 5 ? "border-red-900 bg-red-900/10" : avgVRP < -5 ? "border-green-900 bg-green-900/10" : "border-zinc-800 bg-zinc-900/30"}`}>
        <p className="font-mono text-xs text-zinc-500 mb-1 uppercase tracking-widest">Current Signal</p>
        <p className={`font-mono text-base font-semibold ${sig.color}`}>{sig.text}</p>
        <p className="font-mono text-xs text-zinc-600 mt-1">Average VRP across 7/14/30d: {avgVRP > 0 ? "+" : ""}{avgVRP.toFixed(1)} vol pts</p>
      </div>

      {/* IV vs RV bars */}
      <Panel
        title="Implied vs Realised Volatility"
        subtitle="ATM IV compared to historical realised vol across tenors · VRP = IV − RV · positive VRP = options rich"
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number | undefined, name: string | undefined) => [`${(v ?? 0).toFixed(1)}%`, (name ?? "") === "iv" ? "Implied Vol" : (name ?? "") === "rv" ? "Realised Vol" : "VRP Spread"]}
            />
            <Bar dataKey="iv" name="iv" fill="#3b82f6" fillOpacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={60} />
            <Bar dataKey="rv" name="rv" fill="#22c55e" fillOpacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 px-4 pb-2 text-xs font-mono text-zinc-500">
          <span><span className="text-blue-400">■</span> Implied Vol (Deribit)</span>
          <span><span className="text-green-400">■</span> Realised Vol (Binance close-to-close)</span>
        </div>
      </Panel>

      {/* Detail table */}
      <Panel title="VRP Breakdown" subtitle="Vol risk premium by tenor — how much you are paying in vol terms to hold options">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <Th>Tenor</Th><Th>ATM IV</Th><Th>Realised Vol</Th><Th>VRP Spread</Th><Th>Interpretation</Th>
            </tr>
          </thead>
          <tbody>
            {barData.map((row, i) => {
              const s = signal(row.vrp);
              return (
                <tr key={row.label} className={`border-b border-zinc-800/40 ${i % 2 === 0 ? "bg-zinc-900/20" : ""}`}>
                  <td className="px-4 py-3 text-zinc-100 font-semibold">{row.label}</td>
                  <td className="px-4 py-3 text-blue-400">{row.iv > 0 ? `${row.iv.toFixed(1)}%` : "—"}</td>
                  <td className="px-4 py-3 text-green-400">{row.rv.toFixed(1)}%</td>
                  <td className={`px-4 py-3 font-semibold ${row.vrp > 0 ? "text-red-400" : "text-green-400"}`}>
                    {row.vrp > 0 ? "+" : ""}{row.vrp.toFixed(1)} pts
                  </td>
                  <td className={`px-4 py-3 ${s.color}`}>{s.text.split(" — ")[0]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/20 px-5 py-4">
        <p className="font-mono text-xs text-zinc-600 leading-relaxed">
          <span className="text-zinc-400">Methodology:</span> Implied vol sourced from Deribit ATM options at each tenor. Realised vol calculated as annualised close-to-close log-return standard deviation from Bybit BTCUSDT daily data. VRP = IV − RV. Historically, crypto options trade with a persistent positive VRP (sellers of vol earn the premium), though this inverts during tail events. This is a snapshot and not investment advice.
        </p>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-0.5">{title}</p>
        <p className="text-xs text-zinc-600">{subtitle}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="font-mono text-xs text-zinc-600 mb-1">{label}</p>
      <p className="font-mono text-base font-semibold text-zinc-100">{value}</p>
      {subtitle && <p className="font-mono text-xs text-zinc-600 mt-1">{subtitle}</p>}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left font-mono text-xs text-zinc-600 uppercase tracking-wider">{children}</th>;
}

function LoadingState({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 py-16 text-zinc-500 font-mono text-sm">
      <div className="w-4 h-4 border-2 border-zinc-700 border-t-blue-400 rounded-full animate-spin" />
      {text}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-900 bg-red-900/10 p-4 font-mono text-sm text-red-400">
      Error loading options data: {message}
    </div>
  );
}
