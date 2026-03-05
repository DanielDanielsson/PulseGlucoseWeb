import ApiOverviewContent from '@/content/marketing/api-overview.mdx';

export const metadata = {
  title: 'API Platform',
  description: 'Architecture overview and product information for PulseGlucose API.'
};

export default function ApiPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-8">
        <ApiOverviewContent />
      </article>
    </main>
  );
}
