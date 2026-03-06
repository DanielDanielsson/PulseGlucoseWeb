import { getDocsData } from '@/lib/contracts';

export const metadata = {
  title: 'Agent Context',
  description: 'Agent focused context and machine readable links for PulseGlucose API.'
};

export default async function AgentsPage() {
  const data = await getDocsData();

  return (
    <main className="page-frame">
      <div className="shell-container section-stack">
        <section className="panel hero-card">
          <span className="eyebrow">Agent context</span>
          <h1 className="section-title mt-6">Machine readable entry points without scraping the site.</h1>
          <p className="section-copy mt-6">
            Agents should not reverse engineer marketing HTML. These links expose stable JSON contracts
            and source guidance directly.
          </p>

          <div className="cards-grid mt-6">
            <a href="/agents/context.json" className="panel-muted inline-card font-[var(--font-plex-mono)]">
              <p className="inline-card__title">/agents/context.json</p>
              <p className="inline-card__copy">Integration scope, source guidance, and contract metadata.</p>
            </a>
            <a href="/agents/openapi.json" className="panel-muted inline-card font-[var(--font-plex-mono)]">
              <p className="inline-card__title">/agents/openapi.json</p>
              <p className="inline-card__copy">OpenAPI mirror for endpoint level tooling and code generation.</p>
            </a>
          </div>
        </section>

        <section className="panel content-shell p-8 sm:p-10">
          <h2>Source guidance</h2>
          <div className="cards-grid mt-4">
            {data.agentContext.sourceGuidance.map((item) => (
              <article key={item.source} className="panel-muted inline-card">
                <p className="kicker">{item.source}</p>
                <p className="inline-card__copy mt-3">{item.guidance}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
