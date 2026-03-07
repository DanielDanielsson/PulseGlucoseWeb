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
    <main className="page-frame">
      <div className="shell-container shell-container--docs docs-layout">
        <DocsSidebar groups={groups} />

        <div className="section-stack docs-main">
          <ContractBanner stale={docsData.stale} lastUpdated={docsData.lastUpdated} />
          <div className="panel content-shell p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
