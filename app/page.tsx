import Link from "next/link";

const strategies = [
  {
    href: "/perp-momentum",
    title: "Perp Momentum + Funding Engine",
    tag: "LIVE",
    desc: "Cross-sectional long/short strategy combining momentum, funding carry, OI expansion, and dynamic BTC beta hedging across perpetual futures.",
    metrics: ["Cross-sectional Z-scores", "Annualised funding carry", "BTC beta hedge ratio"],
  },
  {
    href: "/market-structure",
    title: "Market Structure Monitor",
    tag: "LIVE",
    desc: "Dashboard tracking funding rates, OI expansion, and crowding risk across perpetual futures markets, filtered to the top 200 assets by market cap.",
    metrics: ["Annualised funding heatmap", "OI expansion leaderboard", "Crowding risk screen"],
  },
  {
    href: "/factor-btc",
    title: "Factor-Driven BTC Long / Alt Short",
    tag: "LIVE",
    desc: "Systematic long BTC vs short weak, high-FDV, high-funding alts with liquidity and relative-strength filters.",
    metrics: ["FDV/MC ratio filter", "Relative strength screen", "Multi-factor ranking"],
  },
  {
    href: "/options",
    title: "BTC Options Intelligence",
    tag: "LIVE",
    desc: "Vol surface, ATM term structure, 25-delta skew, gamma exposure map, options screener, and implied vs realised vol risk premium — all from live Deribit data.",
    metrics: ["IV surface heatmap", "Gamma flip & GEX map", "Vol risk premium (IV vs RV)"],
  },
  {
    href: "/risk-memo",
    title: "Mock Weekly Risk Memo",
    tag: "GENERATED",
    desc: "Internal-style fund report with regime classification, breadth metrics, funding heatmaps, and dispersion trade ideas — generated fresh from live data.",
    metrics: ["Regime classification", "Market breadth", "Dispersion trade ideas"],
  },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="mb-20">
        <p className="font-mono text-blue-400 text-sm mb-3 tracking-widest uppercase">Portfolio</p>
        <h1 className="text-5xl font-bold text-zinc-100 mb-5 tracking-tight leading-tight">
          Calum Macdonald
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed mb-8">
          Crypto researcher, trader, and builder — previously at Citadel, Damex, and Intuition. I research protocols, trade liquid markets, build AI-powered investment tools, and write about new technologies.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/yieldhunting"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium transition-colors"
          >
            <GithubIcon />
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/calum-macdonald-9566071a1/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <LinkedinIcon />
            LinkedIn
          </a>
          <a
            href="/Calum_Macdonald_CV.pdf"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-medium transition-colors"
          >
            <DownloadIcon />
            Download CV
          </a>
          <Link
            href="/cv"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-medium transition-colors"
          >
            View CV
          </Link>
        </div>
      </div>

      {/* Strategies */}
      <div className="mb-6">
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-2">Live Systems</p>
        <h2 className="text-2xl font-semibold text-zinc-100">Quantitative Finance</h2>
        <p className="text-zinc-500 mt-1 text-sm">Live data from Bybit, Binance, Deribit, and CoinGecko — filtered to the top 200 assets by market cap.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group block rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-600 hover:bg-zinc-900 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                {s.tag}
              </span>
              <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">→</span>
            </div>
            <h3 className="text-zinc-100 font-semibold mb-2 leading-snug">{s.title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">{s.desc}</p>
            <ul className="space-y-1">
              {s.metrics.map((m) => (
                <li key={m} className="font-mono text-xs text-zinc-600 flex items-center gap-1.5">
                  <span className="text-green-500">·</span> {m}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>

      {/* Tech stack */}
      <div className="mt-20 pt-8 border-t border-zinc-800">
        <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest mb-4">Stack</p>
        <div className="flex flex-wrap gap-2">
          {["Python", "TypeScript", "SQL", "Dune Analytics", "Nansen", "DeFiLlama", "Git/GitHub", "Fireblocks", "Claude Code"].map((t) => (
            <span key={t} className="font-mono text-xs text-zinc-500 border border-zinc-800 px-2.5 py-1 rounded">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
