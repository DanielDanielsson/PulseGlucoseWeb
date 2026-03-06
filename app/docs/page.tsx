import { getDocsData } from '@/lib/contracts';

export const metadata = {
  title: 'Docs Overview',
  description: 'Public consumer API documentation for PulseGlucose.'
};

export default async function DocsHomePage() {
  const data = await getDocsData();

  return (
    <article>
      <span className="eyebrow">Documentation overview</span>
      <h1 className="mt-5">Consumer API documentation</h1>
      <p>
        This reference is generated from machine contracts and focused on consumer integrations across web,
        desktop, terminal, and embedded clients.
      </p>

      <section className="stats-grid mt-4">
        <div className="panel-muted metric-card">
          <p className="metric-card__label">Endpoint count</p>
          <p className="metric-card__value">{data.endpoints.length}</p>
          <p className="metric-card__copy">Public consumer routes exposed from the current contract snapshot.</p>
        </div>
        <div className="panel-muted metric-card">
          <p className="metric-card__label">Contract version</p>
          <p className="metric-card__value">{data.agentContext.version}</p>
          <p className="metric-card__copy">Version visible to humans and agents from the same source bundle.</p>
        </div>
        <div className="panel-muted metric-card">
          <p className="metric-card__label">Scope</p>
          <p className="metric-card__value">{data.agentContext.scope}</p>
          <p className="metric-card__copy">Docs stay constrained to the consumer side of the platform.</p>
        </div>
      </section>

      <section className="panel-muted inline-card mt-4">
        <h2 className="inline-card__title">Source strategy is not optional</h2>
        <p className="inline-card__copy">Use the right data source for the right job or the UX degrades fast.</p>
        <ul>
          <li>Use Share glucose endpoints for near real time app state.</li>
          <li>Use Official glucose endpoints for long term analysis and audit history.</li>
        </ul>
      </section>
    </article>
  );
}
