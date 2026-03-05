import { CtaLink } from '@/components/cta-link';

const trustSignals = [
  'Consumer API docs generated from machine contracts',
  'Share vs official source guidance built into every endpoint page',
  'Agent ready JSON mirrors for tool based integration',
  'Status endpoint link for operational transparency'
];

export default function HomePage() {
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PulseGlucoseWeb',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: 'Product portal and public API docs for PulseGlucose ecosystem',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://pulse-glucose-web.vercel.app'
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-900/20">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">PulseGlucose Platform</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
            Product site, app catalog, and docs portal for developers and AI agents.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
            PulseGlucoseWeb is the public front door for integrations. It gives teams one place to evaluate
            the platform, discover consumer apps, and build against contract backed API docs.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink
              href="/docs"
              label="Open Docs"
              eventName="cta_open_docs"
              className="rounded-xl border border-cyan-300/40 bg-cyan-500/15 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
            />
            <CtaLink
              href="/apps"
              label="View Apps"
              eventName="cta_open_apps"
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            />
            <a
              href="https://glucose-nu.vercel.app/status"
              className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
            >
              API Uptime
            </a>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-slate-900/75 p-8">
          <h2 className="text-xl font-semibold text-slate-100">Trust Signals</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {trustSignals.map((signal) => (
              <li key={signal} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                {signal}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
