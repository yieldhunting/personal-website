import { NextResponse } from "next/server";

export const revalidate = 300; // 5 min cache — CoinGecko free tier is rate-limited

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=7d",
      { next: { revalidate: 300 } }
    );

    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);

    const data: CoinGeckoItem[] = await res.json();

    const result = data.map((c) => ({
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      marketCap: c.market_cap,
      fdv: c.fully_diluted_valuation,
      fdvMcRatio: c.fully_diluted_valuation && c.market_cap
        ? c.fully_diluted_valuation / c.market_cap
        : null,
      volume24h: c.total_volume,
      priceChange7d: c.price_change_percentage_7d_in_currency ?? null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

interface CoinGeckoItem {
  symbol: string;
  name: string;
  market_cap: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  price_change_percentage_7d_in_currency: number | null;
}
