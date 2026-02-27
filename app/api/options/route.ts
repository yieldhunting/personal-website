import { NextResponse } from "next/server";
import { parseExpiryDate, realizedVol, type ParsedOption } from "@/lib/options";

export const revalidate = 120;

export async function GET() {
  try {
    // Fetch Deribit options + klines for RV (try Binance spot, fall back to Bybit klines)
    const [deribitRes, binanceKlinesRes, bybitKlinesRes] = await Promise.allSettled([
      fetch(
        "https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=BTC&kind=option",
        { next: { revalidate: 120 } }
      ),
      fetch(
        "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=33",
        { next: { revalidate: 120 } }
      ),
      fetch(
        "https://api.bybit.com/v5/market/kline?category=linear&symbol=BTCUSDT&interval=D&limit=33",
        { next: { revalidate: 120 } }
      ),
    ]);

    if (deribitRes.status === "rejected" || !deribitRes.value.ok) {
      throw new Error(`Deribit error`);
    }
    const deribitResValue = deribitRes.value;

    const { result: rawOptions } = await deribitResValue.json();

    // Pick spot from first valid option
    const spot: number = rawOptions.find((o: DeribitOption) => o.underlying_price)?.underlying_price ?? 0;
    const now = Date.now();

    const options: ParsedOption[] = [];

    for (const o of rawOptions as DeribitOption[]) {
      const parts = o.instrument_name.split("-");
      if (parts.length !== 4) continue;
      const [, expiryStr, strikeStr, typeStr] = parts;
      if (typeStr !== "C" && typeStr !== "P") continue;

      const expiryDate = parseExpiryDate(expiryStr);
      const msLeft = expiryDate.getTime() - now;
      const dte = Math.round(msLeft / (1000 * 60 * 60 * 24));
      if (isNaN(dte) || dte < 1 || dte > 180) continue;

      const strike = parseInt(strikeStr);
      if (isNaN(strike)) continue;
      const moneyness = spot > 0 ? strike / spot : 1;
      if (moneyness < 0.55 || moneyness > 2.2) continue;
      if (!o.mark_iv || o.mark_iv <= 0) continue;

      options.push({
        instrument: o.instrument_name,
        expiry: expiryStr,
        daysToExpiry: dte,
        strike,
        type: typeStr as "C" | "P",
        markIV: o.mark_iv,
        openInterest: o.open_interest ?? 0,
        volume24h: o.volume ?? 0,
        moneyness,
      });
    }

    // Realized vol — try Binance spot klines first, fall back to Bybit
    let rv7 = 0, rv14 = 0, rv30 = 0;
    try {
      if (binanceKlinesRes.status === "fulfilled" && binanceKlinesRes.value.ok) {
        const klines: string[][] = await binanceKlinesRes.value.json();
        const closes = klines.map((k) => parseFloat(k[4]));
        rv7 = realizedVol(closes, 7);
        rv14 = realizedVol(closes, 14);
        rv30 = realizedVol(closes, 30);
      } else if (bybitKlinesRes.status === "fulfilled" && bybitKlinesRes.value.ok) {
        // Bybit kline: [startTime, openPrice, highPrice, lowPrice, closePrice, volume, turnover]
        const json: { result?: { list: string[][] } } = await bybitKlinesRes.value.json();
        const list = (json.result?.list ?? []).reverse(); // Bybit returns newest first
        const closes = list.map((k) => parseFloat(k[4]));
        rv7 = realizedVol(closes, 7);
        rv14 = realizedVol(closes, 14);
        rv30 = realizedVol(closes, 30);
      }
    } catch { /* RV stays 0 if both fail */ }

    return NextResponse.json({
      spot,
      options,
      realizedVol: { rv7d: rv7, rv14d: rv14, rv30d: rv30 },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

interface DeribitOption {
  instrument_name: string;
  underlying_price: number;
  mark_iv: number;
  open_interest: number;
  volume: number;
}
