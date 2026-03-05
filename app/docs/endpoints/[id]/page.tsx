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
      <p className="text-xs uppercase tracking-wide text-cyan-300">{endpoint.group}</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-100">
        <span className="font-mono text-cyan-200">{endpoint.method}</span> {endpoint.path}
      </h1>
      <p className="mt-3 text-slate-300">{endpoint.summary}</p>
      {endpoint.description ? <p className="mt-2 text-slate-400">{endpoint.description}</p> : null}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase text-slate-400">Auth</p>
          <p className="mt-1 text-slate-200">{endpoint.auth}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase text-slate-400">Source</p>
          <p className="mt-1 text-slate-200">{endpoint.source}</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-100">Code Samples</h2>
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
          <h2 className="text-xl font-semibold text-slate-100">Query Parameters</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/70 text-slate-200">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Required</th>
                  <th className="px-3 py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.queryParams.map((query) => (
                  <tr key={query.name} className="border-t border-white/10 text-slate-300">
                    <td className="px-3 py-2 font-mono">{query.name}</td>
                    <td className="px-3 py-2">{query.required ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">{query.description || 'n/a'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Request Example</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/90 p-3 text-xs text-cyan-100">
            <code>{JSON.stringify(endpoint.requestExample, null, 2) || 'null'}</code>
          </pre>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Response Example</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/90 p-3 text-xs text-cyan-100">
            <code>{JSON.stringify(endpoint.responseExample, null, 2) || 'null'}</code>
          </pre>
        </div>
      </section>
    </article>
  );
}
