import { notFound } from 'next/navigation';
import { CodeTabs } from '@/components/code-tabs';
import { getDocsData } from '@/lib/contracts';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Endpoint ${id}`
  };
}

export default async function EndpointDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await getDocsData();
  const { id } = await params;
  const endpoint = data.endpoints.find((item) => item.id === id);

  if (!endpoint) {
    notFound();
  }

  return (
    <article>
      <span className="eyebrow">{endpoint.group}</span>
      <h1 className="mt-5">
        <span className="font-[var(--font-plex-mono)] text-[var(--accent-strong)]">{endpoint.method}</span>{' '}
        {endpoint.path}
      </h1>
      <p>{endpoint.summary}</p>
      {endpoint.description ? <p>{endpoint.description}</p> : null}

      <div className="cards-grid mt-4">
        <div className="panel-muted inline-card">
          <p className="kicker">Auth</p>
          <p className="inline-card__copy mt-3 text-[var(--text)]">{endpoint.auth}</p>
        </div>
        <div className="panel-muted inline-card">
          <p className="kicker">Source</p>
          <p className="inline-card__copy mt-3 text-[var(--text)]">{endpoint.source}</p>
        </div>
      </div>

      <section className="mt-6">
        <h2>Code samples</h2>
        <div className="mt-3">
          <CodeTabs
            curl={endpoint.codeSamples.curl}
            javascript={endpoint.codeSamples.javascript}
            python={endpoint.codeSamples.python}
          />
        </div>
      </section>

      {endpoint.queryParams.length > 0 ? (
        <section className="mt-8">
          <h2>Query parameters</h2>
          <div className="table-shell mt-3">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.queryParams.map((query) => (
                  <tr key={query.name}>
                    <td className="font-[var(--font-plex-mono)]">{query.name}</td>
                    <td>{query.required ? 'Yes' : 'No'}</td>
                    <td>{query.description || 'n/a'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="cards-grid mt-8">
        <div>
          <h2>Request example</h2>
          <pre className="mt-3 code-shell">
            <code>{JSON.stringify(endpoint.requestExample, null, 2) || 'null'}</code>
          </pre>
        </div>
        <div>
          <h2>Response example</h2>
          <pre className="mt-3 code-shell">
            <code>{JSON.stringify(endpoint.responseExample, null, 2) || 'null'}</code>
          </pre>
        </div>
      </section>
    </article>
  );
}
