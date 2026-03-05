import { ContractBanner } from '@/components/contract-banner';
import { DocsSidebar } from '@/components/docs-sidebar';
import { getDocsData } from '@/lib/contracts';

export default async function DocsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const docsData = await getDocsData();
  const groups = Array.from(docsData.groupedEndpoints.entries()).map(([name, endpoints]) => ({
    name,
    endpoints
  }));

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
      <DocsSidebar groups={groups} />

      <div className="space-y-5">
        <ContractBanner stale={docsData.stale} lastUpdated={docsData.lastUpdated} />
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}
