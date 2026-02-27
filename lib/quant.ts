export interface Ticker {
  symbol: string;
  priceChange1d: number;
  price: number;
  volume24h: number;
  fundingRate: number;
  fundingAnn: number; // annualised %
}

export interface Signal {
  symbol: string;
  price: number;
  volume24h: number;
  momentum1d: number;      // raw % change
  momentumZ: number;       // cross-sectional z-score
  fundingAnn: number;      // annualised funding %
  fundingZ: number;
  score: number;           // composite signal (-1 short, +1 long)
}

/** Cross-sectional z-score of an array of values */
export function zScore(values: number[]): number[] {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / values.length);
  if (std === 0) return values.map(() => 0);
  return values.map((v) => (v - mean) / std);
}

/** Clamp a value between min and max */
export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Format large numbers */
export function fmtVolume(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toFixed(0)}`;
}

export function fmtPct(v: number, decimals = 2): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(decimals)}%`;
}

/**
 * Compute cross-sectional signals from raw tickers.
 * Returns top N longs and shorts by composite score.
 */
export function computeSignals(tickers: Ticker[], topN = 15): { longs: Signal[]; shorts: Signal[] } {
  if (tickers.length === 0) return { longs: [], shorts: [] };

  // Remove BTC from ranking (it's the hedge, not the universe)
  const universe = tickers.filter((t) => t.symbol !== "BTC");

  const mom1d = universe.map((t) => t.priceChange1d);
  const funding = universe.map((t) => t.fundingAnn);

  const momZ = zScore(mom1d);
  const fundZ = zScore(funding);

  // Composite: 60% momentum (higher = better for longs), 40% funding carry (lower = better for longs)
  const signals: Signal[] = universe.map((t, i) => ({
    symbol: t.symbol,
    price: t.price,
    volume24h: t.volume24h,
    momentum1d: t.priceChange1d,
    momentumZ: momZ[i],
    fundingAnn: t.fundingAnn,
    fundingZ: fundZ[i],
    score: clamp(0.6 * momZ[i] - 0.4 * fundZ[i], -3, 3),
  }));

  signals.sort((a, b) => b.score - a.score);

  return {
    longs: signals.slice(0, topN),
    shorts: signals.slice(-topN).reverse(),
  };
}

/**
 * Approximate BTC beta: simple correlation-proxy using 1d momentum
 * (true beta needs kline history, but this is a reasonable live proxy)
 */
export function approximateBtcBeta(tickers: Ticker[]): number {
  const btc = tickers.find((t) => t.symbol === "BTC");
  if (!btc || btc.priceChange1d === 0) return 1;
  const alts = tickers.filter((t) => t.symbol !== "BTC");
  const meanAltReturn = alts.reduce((a, b) => a + b.priceChange1d, 0) / alts.length;
  return meanAltReturn / btc.priceChange1d;
}

/**
 * Breadth: % of alts with positive 1d returns
 */
export function marketBreadth(tickers: Ticker[]): number {
  const alts = tickers.filter((t) => t.symbol !== "BTC");
  const positive = alts.filter((t) => t.priceChange1d > 0).length;
  return (positive / alts.length) * 100;
}

/**
 * Regime classification based on BTC 1d return
 */
export function classifyRegime(btcReturn1d: number): { label: string; color: string } {
  if (btcReturn1d > 3) return { label: "Risk-On / Trending", color: "text-green-400" };
  if (btcReturn1d < -3) return { label: "Risk-Off / Drawdown", color: "text-red-400" };
  return { label: "Ranging / Choppy", color: "text-yellow-400" };
}
