import ApiOverviewContent from '@/content/marketing/api-overview.mdx';

export const metadata = {
  title: 'API Platform',
  description: 'Architecture overview and product information for PulseGlucose API.'
};

export default function ApiPage() {
  return (
    <main className="page-frame">
      <div className="shell-container section-stack">
        <section className="panel hero-card">
          <span className="eyebrow">API platform</span>
          <h1 className="section-title mt-6">Backend first glucose delivery with clear source boundaries.</h1>
          <p className="section-copy mt-6">
            PulseGlucoseApi exists to keep consumer apps responsive without sacrificing history quality.
            Share routes handle live app state. Official routes handle long term analysis and audit trails.
          </p>
        </section>

        <article className="panel content-shell mdx-shell p-8 sm:p-10">
          <ApiOverviewContent />
        </article>
      </div>
    </main>
  );
}
