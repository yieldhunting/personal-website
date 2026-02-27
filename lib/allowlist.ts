const STABLECOINS = new Set([
  "USDT", "USDC", "DAI", "BUSD", "TUSD", "USDP", "FDUSD", "USDE", "PYUSD",
  "USDS", "GUSD", "LUSD", "FRAX", "SUSD", "CUSD", "CEUR",
]);

const WRAPPED = new Set([
  "WBTC", "WETH", "WBNB", "STETH", "WSTETH", "CBBTC", "RETH", "WEETH",
  "EZETH", "RSETH", "LSETH",
]);

/**
 * Fetch the top N non-stable, non-wrapped crypto symbols by market cap from CoinGecko.
 * Returns symbols in market-cap order (largest first).
 * Cached for 10 minutes via Next.js fetch cache.
 */
export async function fetchTopSymbols(n = 100): Promise<Set<string>> {
  try {
    const pages = n <= 100 ? 1 : 2;
    const results = await Promise.all(
      Array.from({ length: pages }, (_, i) =>
        fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${i + 1}&sparkline=false`,
          { next: { revalidate: 600 } }
        ).then((r) => (r.ok ? r.json() : []))
      )
    );

    const symbols: string[] = results
      .flat()
      .map((c: { symbol: string }) => c.symbol.toUpperCase())
      .filter((s: string) => !STABLECOINS.has(s) && !WRAPPED.has(s))
      .slice(0, n);

    return new Set(symbols);
  } catch {
    // If CoinGecko is unavailable, return an empty set — callers should handle gracefully
    return new Set<string>();
  }
}

/**
 * Same as fetchTopSymbols but returns an ordered array (market-cap rank preserved).
 */
export async function fetchTopSymbolsOrdered(n = 100): Promise<string[]> {
  const set = await fetchTopSymbols(n);
  return [...set];
}
