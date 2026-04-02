"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/cv", label: "CV" },
  { href: "/writing", label: "Writing" },
  { href: "/perp-momentum", label: "Momentum Engine" },
  { href: "/market-structure", label: "Market Structure" },
  { href: "/factor-btc", label: "Factor / BTC" },
  { href: "/options", label: "Options" },
  { href: "/risk-memo", label: "Risk Memo" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-mono text-sm font-semibold text-zinc-100 tracking-tight">
          calum<span className="text-blue-400">.</span>dev
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                pathname === href
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
