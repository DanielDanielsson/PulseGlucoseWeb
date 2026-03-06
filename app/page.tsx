import { CtaLink } from '@/components/cta-link';

const trustSignals = [
  'Live contract backed docs for consumer integrations',
  'Agent ready JSON mirrors for tool driven workflows',
  'Separate real time and historical glucose source guidance',
  'Status visibility and endpoint level integration examples'
];

const platformMetrics = [
  {
    label: 'Delivery model',
    value: 'Contract first',
    copy: 'One public surface for product messaging, API reference, and machine readable context.'
  },
  {
    label: 'Frontend stance',
    value: 'Full width',
    copy: 'Wide panels, tighter typography, and less wasted space on large displays.'
  },
  {
    label: 'Source strategy',
    value: 'Real time + audit',
    copy: 'Share paths keep interfaces current while official paths preserve durable history.'
  }
];

const featureCards = [
  {
    title: 'Docs that stay operational',
    copy: 'Endpoint pages are generated from contracts so the public reference does not drift from the actual API surface.'
  },
  {
    title: 'Built for apps, not just browsers',
    copy: 'PulseBar, dashboards, terminals, and embedded displays can all read the same integration guidance.'
  },
  {
    title: 'Human and machine entry points',
    copy: 'Developers get readable docs. Agents get stable JSON documents without scraping a marketing site.'
  },
  {
    title: 'Minimal by design',
    copy: 'No decorative clutter, no cramped center column, and no fake enterprise chrome.'
  }
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
    <main className="page-frame">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />

      <div className="shell-container section-stack">
        <section className="hero-grid">
          <div className="panel hero-card">
            <span className="eyebrow">PulseGlucose platform</span>
            <h1 className="section-title mt-6">
              Clean high signal docs for products that live on real time glucose data.
            </h1>
            <p className="section-copy mt-6">
              PulseGlucoseWeb is the public front door for the ecosystem. It packages product context,
              contract backed endpoint docs, and app specific integration guidance into one wide interface
              that feels deliberate instead of generic.
            </p>

            <div className="hero-card__actions">
              <CtaLink href="/docs" label="Open Docs" eventName="cta_open_docs" className="button-primary" />
              <CtaLink href="/apps" label="View Apps" eventName="cta_open_apps" className="button-secondary" />
              <a href="https://glucose-nu.vercel.app/status" className="button-ghost">
                API Status
              </a>
            </div>

            <div className="hero-card__meta">
              <span className="data-chip">Real time consumer integrations</span>
              <span className="data-chip">Agent readable JSON context</span>
              <span className="data-chip">Wide layout system</span>
            </div>
          </div>

          <aside className="panel side-card status-card">
            <span className="kicker">Signal map</span>
            <h2 className="mt-0 text-2xl font-semibold tracking-[-0.04em]">What this site is actually for</h2>
            <ul className="signal-list">
              {trustSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="stats-grid">
          {platformMetrics.map((metric) => (
            <article key={metric.label} className="panel metric-card">
              <p className="metric-card__label">{metric.label}</p>
              <p className="metric-card__value">{metric.value}</p>
              <p className="metric-card__copy">{metric.copy}</p>
            </article>
          ))}
        </section>

        <section className="cards-grid">
          {featureCards.map((card) => (
            <article key={card.title} className="panel-muted inline-card">
              <h2 className="inline-card__title">{card.title}</h2>
              <p className="inline-card__copy">{card.copy}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
