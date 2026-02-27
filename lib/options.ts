// ─── Normal distribution helpers ───────────────────────────────────────────

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly =
    t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-x * x));
}

export function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// ─── Black-Scholes Greeks ───────────────────────────────────────────────────

export interface Greeks {
  delta: number;
  gamma: number;
  vega: number;   // per 1% vol
  theta: number;  // per day
}

/**
 * Compute BS Greeks.
 * @param S     spot price
 * @param K     strike price
 * @param T     time to expiry in years
 * @param ivPct implied vol as percentage (e.g. 80.5)
 * @param type  "C" | "P"
 */
export function bsGreeks(S: number, K: number, T: number, ivPct: number, type: "C" | "P"): Greeks {
  const sigma = ivPct / 100;
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    const itm = type === "C" ? S > K : K > S;
    return { delta: itm ? (type === "C" ? 1 : -1) : 0, gamma: 0, vega: 0, theta: 0 };
  }
  const r = 0;
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + 0.5 * sigma * sigma * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const nd1 = normalPDF(d1);
  const delta = type === "C" ? normalCDF(d1) : normalCDF(d1) - 1;
  const gamma = nd1 / (S * sigma * sqrtT);
  const vega = (S * nd1 * sqrtT) / 100;
  const Nd2 = normalCDF(type === "C" ? d2 : -d2);
  const theta =
    (-S * nd1 * sigma) / (2 * sqrtT) + (type === "C" ? -1 : 1) * r * K * Math.exp(-r * T) * Nd2;
  return { delta, gamma, vega, theta: theta / 365 };
}

// ─── Expiry parsing ─────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

/** Parse Deribit expiry string like "27JUN25" or "3MAR26" → UTC Date at 08:00 */
export function parseExpiryDate(s: string): Date {
  const m = s.match(/^(\d{1,2})([A-Z]{3})(\d{2})$/);
  if (!m) return new Date(NaN);
  const day = parseInt(m[1]);
  const month = MONTHS[m[2]];
  const year = 2000 + parseInt(m[3]);
  return new Date(Date.UTC(year, month, day, 8, 0, 0));
}

// ─── Realized vol ────────────────────────────────────────────────────────────

/** Annualised realised vol (%) from daily close prices */
export function realizedVol(closes: number[], days: number): number {
  const slice = closes.slice(-Math.min(days + 1, closes.length));
  if (slice.length < 3) return 0;
  const returns = slice.slice(1).map((c, i) => Math.log(c / slice[i]));
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance * 365) * 100;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedOption {
  instrument: string;
  expiry: string;         // "27JUN25"
  daysToExpiry: number;
  strike: number;
  type: "C" | "P";
  markIV: number;         // percent
  openInterest: number;   // BTC
  volume24h: number;      // BTC
  moneyness: number;      // strike / spot
}

export interface EnrichedOption extends ParsedOption {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  openInterestUSD: number;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface TermPoint {
  expiry: string;
  dte: number;
  atmIV: number;
  skew25d: number | null; // put25d IV - call25d IV
}

/** Compute term structure: ATM IV and 25-delta skew per expiry */
export function computeTermStructure(opts: EnrichedOption[], spot: number): TermPoint[] {
  const byExpiry: Record<string, EnrichedOption[]> = {};
  for (const o of opts) {
    (byExpiry[o.expiry] ??= []).push(o);
  }

  return Object.entries(byExpiry)
    .map(([expiry, group]) => {
      const dte = group[0].daysToExpiry
        ?? Math.round((parseExpiryDate(expiry).getTime() - Date.now()) / 86_400_000);
      // ATM: call closest to delta = 0.5
      const calls = group.filter((o) => o.type === "C" && o.markIV > 0);
      calls.sort((a, b) => Math.abs(a.delta - 0.5) - Math.abs(b.delta - 0.5));
      const atmIV = calls[0]?.markIV ?? 0;

      // 25-delta skew
      const puts = group.filter((o) => o.type === "P" && o.markIV > 0);
      puts.sort((a, b) => Math.abs(Math.abs(a.delta) - 0.25) - Math.abs(Math.abs(b.delta) - 0.25));
      calls.sort((a, b) => Math.abs(a.delta - 0.25) - Math.abs(b.delta - 0.25));
      const put25 = puts[0];
      const call25 = calls[0];
      const skew25d =
        put25 && call25 ? put25.markIV - call25.markIV : null;

      return { expiry, dte, atmIV, skew25d };
    })
    .filter((p) => p.atmIV > 0)
    .sort((a, b) => a.dte - b.dte);
}

export interface GEXPoint {
  strike: number;
  gex: number; // USD
  cumGex: number;
}

/**
 * Compute net dealer GEX per strike.
 * Assumes dealers are short all options (retail buys, dealers sell).
 * Dealer call GEX = +gamma*OI (long gamma hedge), put GEX = -gamma*OI.
 * Net GEX = (callGamma - putGamma) * OI * spot² / 100
 */
export function computeGEX(opts: EnrichedOption[], spot: number): GEXPoint[] {
  const byStrike: Record<number, { callGex: number; putGex: number }> = {};

  for (const o of opts) {
    if (!byStrike[o.strike]) byStrike[o.strike] = { callGex: 0, putGex: 0 };
    const dollarGamma = o.gamma * o.openInterest * spot * spot * 0.01;
    if (o.type === "C") byStrike[o.strike].callGex += dollarGamma;
    else byStrike[o.strike].putGex += dollarGamma;
  }

  const points = Object.entries(byStrike)
    .map(([k, v]) => ({
      strike: parseInt(k),
      gex: v.callGex - v.putGex,
      cumGex: 0,
    }))
    .sort((a, b) => a.strike - b.strike);

  // Cumulative GEX (for finding gamma flip)
  let cum = 0;
  for (const p of points) {
    cum += p.gex;
    p.cumGex = cum;
  }

  return points;
}

// ─── Vol surface helpers ─────────────────────────────────────────────────────

export const SURFACE_MONEYNESS = [0.75, 0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20, 1.25];

/** Snap moneyness to nearest surface bucket */
export function snapMoneyness(m: number): number | null {
  const nearest = SURFACE_MONEYNESS.reduce((a, b) => (Math.abs(a - m) < Math.abs(b - m) ? a : b));
  return Math.abs(nearest - m) < 0.03 ? nearest : null;
}

/** Build vol surface: { [moneyness]: { [expiry]: iv } } */
export function buildVolSurface(
  opts: EnrichedOption[],
  expiries: string[]
): Record<number, Record<string, number | null>> {
  const surface: Record<number, Record<string, number | null>> = {};

  for (const m of SURFACE_MONEYNESS) {
    surface[m] = {};
    for (const e of expiries) surface[m][e] = null;
  }

  for (const o of opts) {
    if (!expiries.includes(o.expiry)) continue;
    const bucket = snapMoneyness(o.moneyness);
    if (bucket === null || o.markIV <= 0) continue;
    // Prefer call IV above spot, put IV below spot (standard surface convention)
    const isPreferred = o.moneyness >= 1 ? o.type === "C" : o.type === "P";
    if (isPreferred || surface[bucket][o.expiry] === null) {
      surface[bucket][o.expiry] = o.markIV;
    }
  }

  return surface;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function fmtIV(v: number | null): string {
  if (v === null || v === 0) return "—";
  return `${v.toFixed(1)}%`;
}

export function fmtDelta(v: number): string {
  return v.toFixed(3);
}

export function fmtGamma(v: number): string {
  return v.toExponential(2);
}

export function fmtUSD(v: number): string {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}
