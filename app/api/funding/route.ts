import { NextResponse } from "next/server";
import { fetchTopSymbolsOrdered } from "@/lib/allowlist";

export const revalidate = 60;

// Fallback if CoinGecko is unavailable
const FALLBACK_SYMBOLS = [
  "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX",
  "LINK", "DOT", "POL", "UNI", "ATOM", "LTC", "BCH",
  "APT", "OP", "ARB", "SUI", "TRX",
];

export async function GET() {
  try {
    // Fetch allowlist + both venues in parallel
    const [orderedSymbols, bybitRes, binanceRes] = await Promise.allSettled([
      fetchTopSymbolsOrdered(200),
      fetch("https://api.bybit.com/v5/market/tickers?category=linear", { next: { revalidate: 60 } }),
      fetch("https://fapi.binance.com/fapi/v1/premiumIndex", { next: { revalidate: 60 } }),
    ]);

    // ─── Bybit map ──────────────────────────────────────────────────────────
    const bybitMap: Record<string, number> = {};
    if (bybitRes.status === "fulfilled" && bybitRes.value.ok) {
      const data: BybitResponse = await bybitRes.value.json();
      for (const item of (data.retCode === 0 ? data.result?.list : null) ?? []) {
        if (item.symbol.endsWith("USDT")) {
          const rate = parseFloat(item.fundingRate || "0"); // || catches empty string
          if (!isNaN(rate)) {
            const sym = item.symbol.replace("USDT", "");
            bybitMap[sym] = rate * 3 * 365 * 100;
          }
        }
      }
    }

    // ─── Binance map (optional) ──────────────────────────────────────────────
    const binanceMap: Record<string, number> = {};
    if (binanceRes.status === "fulfilled" && binanceRes.value.ok) {
      const data: BinancePremium[] = await binanceRes.value.json();
      for (const item of data) {
        if (item.symbol.endsWith("USDT")) {
          const rate = parseFloat(item.lastFundingRate || "0");
          if (!isNaN(rate)) {
            const sym = item.symbol.replace("USDT", "");
            binanceMap[sym] = rate * 3 * 365 * 100;
          }
        }
      }
    }

    // Require at least one venue to have data
    if (Object.keys(bybitMap).length === 0 && Object.keys(binanceMap).length === 0) {
      throw new Error("No funding data available from any venue");
    }

    // Start from market-cap-ranked allowlist, fall back to hardcoded list
    const ranked =
      orderedSymbols.status === "fulfilled" && orderedSymbols.value.length > 0
        ? orderedSymbols.value
        : FALLBACK_SYMBOLS;

    // Only include symbols that have real data on at least one venue, take top 20
    const result = ranked
      .filter((sym) => bybitMap[sym] !== undefined || binanceMap[sym] !== undefined)
      .slice(0, 20)
      .map((sym) => {
        const b = binanceMap[sym] ?? null;
        const bb = bybitMap[sym] ?? null;
        return {
          symbol: sym,
          binance: b,
          bybit: bb,
          divergence: b !== null && bb !== null ? Math.abs(b - bb) : null,
        };
      });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

interface BinancePremium {
  symbol: string;
  lastFundingRate: string;
}

interface BybitResponse {
  retCode: number;
  result?: {
    list: { symbol: string; fundingRate?: string }[];
  };
}
