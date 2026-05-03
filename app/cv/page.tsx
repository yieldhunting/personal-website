export const metadata = {
  title: "CV – Calum Macdonald",
};

const experience = [
  {
    role: "Growth Lead",
    company: "Intuition",
    period: "August 2024 – Present",
    bullets: [
      "Key player in the launch of $TRUST token, achieving day-one listings on Binance, Coinbase, Kraken, Upbit, KuCoin, and other major exchanges, debuting at a 9-figure fully diluted valuation with sustained trading volume.",
      "Grew X following from ~30K to 157K+ (5×) and supported testnet campaigns that drove 17.5M transactions from 900K+ unique accounts, contributing to 5.1M+ verified on-chain attestations.",
      "Built data pipelines (Python, TypeScript) that scrape, enrich, and structure data from Reddit, Twitter, and GitHub for Intuition's knowledge graph — automated extraction of AI tool metadata, sentiment, and engagement signals.",
      "Developed on-chain automation scripts using Intuition's SDK to batch-create atoms, triples, and curated lists on mainnet and testnet, managing deterministic cross-chain deployments.",
      "Designed and executed AI-assisted content workflows using Claude Code — long-form blog posts, Twitter threads, content calendars, and programmatic video/graphics (Remotion) — integrated with Notion, Linear, and Google Calendar via MCP.",
      "Led community growth initiatives including on-chain quests (Galxe, Layer3), airdrop eligibility design using Dune dashboards and Python-based wallet filtering, and the Atlas community forum for developer-focused thought leadership.",
      "Conducted BD research and DeFi partnership strategy — identified integration targets, drafted outreach, and developed go-to-market positioning for protocol partnerships and token utility expansion.",
    ],
  },
  {
    role: "Trader",
    company: "Damex",
    period: "August 2021 – August 2024",
    bullets: [
      "Executed billions of dollars in cryptocurrency OTC trades with major liquidity providers including B2C2, Galaxy Digital, and Enigma, settling via Fireblocks.",
      "Managed relationships with high-net-worth individuals, protocol founders, and payment company executives across fiat-crypto and crypto-crypto pairs.",
      "Contributed to trading system development and operational improvements across the desk.",
      "Implemented yield farming strategies, executed on-chain DeFi trades, and managed a directional altcoin portfolio.",
    ],
  },
  {
    role: "Intern",
    company: "Citadel / Citadel Securities",
    period: "April 2020",
    bullets: [],
  },
];

const skills = [
  "Python", "TypeScript", "SQL", "Dune Analytics", "Nansen", "DeFiLlama",
  "Token Terminal", "Messari", "Coinalyze", "Git/GitHub", "Fireblocks",
  "Uniswap", "Aave", "Curve", "Claude Code / AI-assisted workflows",
];

const additional = [
  "Member of InternDAO",
  "Personal crypto trading and research since 2017",
  "Traded at Rotman International Trading Competition",
];

export default function CVPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12 pb-8 border-b border-zinc-800">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">Calum Macdonald</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 font-mono mb-5">
          <a href="mailto:calum.a.macdonald@hotmail.com" className="hover:text-zinc-300 transition-colors">
            calum.a.macdonald@hotmail.com
          </a>
        </div>
        <div className="flex flex-wrap gap-3 mb-5">
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
        </div>
        <a
          href="/Calum_Macdonald_CV.pdf"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-medium transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </a>
      </div>

      {/* Experience */}
      <section className="mb-12">
        <SectionLabel>Experience</SectionLabel>
        <div className="space-y-10">
          {experience.map((job) => (
            <div key={job.company + job.period}>
              <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
                <div>
                  <span className="text-zinc-100 font-semibold">{job.role}</span>
                  <span className="text-zinc-400"> – {job.company}</span>
                </div>
                <span className="font-mono text-xs text-zinc-600">{job.period}</span>
              </div>
              {job.bullets.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {job.bullets.map((b, i) => (
                    <li key={i} className="flex gap-3 text-zinc-400 text-sm leading-relaxed">
                      <span className="text-zinc-700 mt-1.5 flex-shrink-0">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-12">
        <SectionLabel>Education</SectionLabel>
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <span className="text-zinc-100 font-semibold">University of Edinburgh</span>
          <span className="text-zinc-400 text-sm">CertHE – Chemical Engineering</span>
        </div>
      </section>

      {/* Skills */}
      <section className="mb-12">
        <SectionLabel>Skills & Tools</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s} className="font-mono text-xs text-zinc-400 border border-zinc-800 px-2.5 py-1 rounded bg-zinc-900/50">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Additional */}
      <section>
        <SectionLabel>Additional</SectionLabel>
        <ul className="space-y-1.5">
          {additional.map((a) => (
            <li key={a} className="flex gap-3 text-zinc-400 text-sm">
              <span className="text-zinc-700">·</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </section>
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">{children}</p>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}
