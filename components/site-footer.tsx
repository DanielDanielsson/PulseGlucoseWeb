import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-400 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <p>PulseGlucoseWeb v1. Public docs for PulseGlucose ecosystem.</p>
        <div className="flex items-center gap-4">
          <Link href="/docs" className="hover:text-cyan-300">
            Docs
          </Link>
          <a href="https://glucose-nu.vercel.app/status" className="hover:text-cyan-300">
            API Status
          </a>
          <Link href="/agents" className="hover:text-cyan-300">
            Agent Context
          </Link>
        </div>
      </div>
    </footer>
  );
}
