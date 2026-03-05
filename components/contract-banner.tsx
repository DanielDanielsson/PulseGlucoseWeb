interface ContractBannerProps {
  lastUpdated: string;
  stale: boolean;
}

export function ContractBanner({ lastUpdated, stale }: ContractBannerProps) {
  return (
    <aside
      className={`rounded-xl border px-4 py-3 text-sm ${
        stale
          ? 'border-amber-300/40 bg-amber-500/10 text-amber-100'
          : 'border-emerald-300/40 bg-emerald-500/10 text-emerald-100'
      }`}
    >
      <p className="font-medium">Contract snapshot</p>
      <p className="mt-1 opacity-90">
        Last updated: <span className="font-mono">{new Date(lastUpdated).toISOString()}</span>
      </p>
      <p className="mt-1 opacity-90">
        {stale
          ? 'Using bundled snapshot because remote contract fetch failed.'
          : 'Using live remote contracts with incremental revalidation.'}
      </p>
    </aside>
  );
}
