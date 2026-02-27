import { NextResponse } from "next/server";
import { fetchTopSymbols } from "@/lib/allowlist";

export const revalidate = 60;

export async function GET() {
  // Fetch exchange data and market-cap allowlist in parallel
  const [exchangeData, allowlist] = await Promise.all([
    (async () => {
      try {
        const data = await fetchBybit();
        if (data.length > 0) return data;
      } catch {}
      try {
        return await fetchBinance();
      } catch {}
      return null;
    })(),
    fetchTopSymbols(200),
  ]);

  if (!exchangeData) {
    return NextResponse.json({ error: "All data sources unavailable" }, { status: 503 });
  }

  // If allowlist fetch failed (CoinGecko down), fall back to volume-only filter
  const filtered =
    allowlist.size > 0
      ? exchangeData.filter((t) => allowlist.has(t.symbol))
      : exchangeData;

  return NextResponse.json(filtered);
}

// ─── Bybit ────────────────────────────────────────────────────────────────────

async function fetchBybit() {
  const res = await fetch(
    "https://api.bybit.com/v5/market/tickers?category=linear",
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`Bybit ${res.status}`);

  const json: BybitResponse = await res.json();
  const list = json.result?.list ?? [];

  return list
    .filter((t) => t.symbol.endsWith("USDT") && parseFloat(t.turnover24h) > 5_000_000)
    .map((t) => ({
      symbol: t.symbol.replace("USDT", ""),
      priceChange1d: parseFloat(t.price24hPcnt) * 100, // Bybit returns decimal
      price: parseFloat(t.lastPrice),
      volume24h: parseFloat(t.turnover24h),
      fundingRate: parseFloat(t.fundingRate || "0"),
      fundingAnn: parseFloat(t.fundingRate || "0") * 3 * 365 * 100,
    }));
}

interface BybitResponse {
  result?: {
    list: {
      symbol: string;
      lastPrice: string;
      price24hPcnt: string;
      turnover24h: string;
      fundingRate?: string;
    }[];
  };
}

// ─── Binance (fallback) ───────────────────────────────────────────────────────

async function fetchBinance() {
  const [tickerRes, fundingRes] = await Promise.all([
    fetch("https://fapi.binance.com/fapi/v1/ticker/24hr", { next: { revalidate: 60 } }),
    fetch("https://fapi.binance.com/fapi/v1/premiumIndex", { next: { revalidate: 60 } }),
  ]);
  if (!tickerRes.ok || !fundingRes.ok) throw new Error(`Binance ${tickerRes.status}`);

  const tickers: BinanceTicker[] = await tickerRes.json();
  const funding: BinanceFunding[] = await fundingRes.json();

  const fundingMap: Record<string, string> = {};
  for (const f of funding) fundingMap[f.symbol] = f.lastFundingRate;

  return tickers
    .filter((t) => t.symbol.endsWith("USDT") && parseFloat(t.quoteVolume) > 5_000_000)
    .map((t) => {
      const rate = parseFloat(fundingMap[t.symbol] ?? "0");
      return {
        symbol: t.symbol.replace("USDT", ""),
        priceChange1d: parseFloat(t.priceChangePercent),
        price: parseFloat(t.lastPrice),
        volume24h: parseFloat(t.quoteVolume),
        fundingRate: rate,
        fundingAnn: rate * 3 * 365 * 100,
      };
    });
}

interface BinanceTicker {
  symbol: string;
  priceChangePercent: string;
  lastPrice: string;
  quoteVolume: string;
}

interface BinanceFunding {
  symbol: string;
  lastFundingRate: string;
}
