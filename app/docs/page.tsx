import { getDocsData } from '@/lib/contracts';

export const metadata = {
  title: 'Docs Overview',
  description: 'Public consumer API documentation for PulseGlucose.'
};

export default async function DocsHomePage() {
  const data = await getDocsData();

  return (
    <article>
      <h1 className="text-3xl font-semibold text-slate-100">Consumer API Documentation</h1>
      <p className="mt-4 max-w-3xl leading-7 text-slate-300">
        This reference is generated from machine contracts and focused on consumer integrations across web,
        mobile, CLI, and Raspberry Pi projects.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase text-slate-400">Endpoint count</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{data.endpoints.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase text-slate-400">Contract version</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{data.agentContext.version}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase text-slate-400">Scope</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{data.agentContext.scope}</p>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-amber-300/35 bg-amber-500/10 p-4 text-sm text-amber-100">
        <p className="font-semibold">Source strategy is critical</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Use Share glucose endpoints for near real time updates.</li>
          <li>Use Official glucose endpoints for long term analysis and audit history.</li>
        </ul>
      </section>
    </article>
  );
}
