import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/api', label: 'API' },
  { href: '/apps', label: 'Apps' },
  { href: '/docs', label: 'Docs' },
  { href: '/agents', label: 'Agents' }
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f172ad9] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-cyan-200">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
          PulseGlucoseWeb
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200 transition hover:border-cyan-300/50 hover:bg-cyan-500/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
