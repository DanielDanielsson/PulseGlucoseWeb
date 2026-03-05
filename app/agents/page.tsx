import { getDocsData } from '@/lib/contracts';

export const metadata = {
  title: 'Agent Context',
  description: 'Agent focused context and machine readable links for PulseGlucose API.'
};

export default async function AgentsPage() {
  const data = await getDocsData();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-8">
        <h1 className="text-3xl font-semibold text-slate-100">Agent Integration Context</h1>
        <p className="mt-3 leading-7 text-slate-300">
          This page gives AI agents a stable starting point. Use the raw JSON links below as primary input.
        </p>

        <div className="mt-6 grid gap-4">
          <a
            href="/agents/context.json"
            className="rounded-xl border border-cyan-300/40 bg-cyan-500/10 px-4 py-3 font-mono text-sm text-cyan-100"
          >
            /agents/context.json
          </a>
          <a
            href="/agents/openapi.json"
            className="rounded-xl border border-cyan-300/40 bg-cyan-500/10 px-4 py-3 font-mono text-sm text-cyan-100"
          >
            /agents/openapi.json
          </a>
        </div>

        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-xl font-semibold text-slate-100">Source Guidance</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {data.agentContext.sourceGuidance.map((item) => (
              <li key={item.source}>
                <span className="font-semibold text-cyan-200">{item.source}: </span>
                {item.guidance}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
