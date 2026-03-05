const apps = [
  {
    title: 'Web Dashboard',
    platform: 'Web',
    description: 'Real time browser dashboard with share source glucose and notification stream support.'
  },
  {
    title: 'PulseBar',
    platform: 'macOS menubar',
    description: 'Desktop menubar monitor with quick glance glucose state and alert support.'
  },
  {
    title: 'CLI Watcher',
    platform: 'CLI',
    description: 'Terminal mode workflow for polling, alerts, and local automation scripts.'
  },
  {
    title: 'Raspberry Pi Display',
    platform: 'Embedded',
    description: 'Low power always on display mode with stream reconnect strategy and local cache.'
  }
];

export const metadata = {
  title: 'Apps',
  description: 'Consumer app landscape for PulseGlucose integrations.'
};

export default function AppsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-slate-100">Consumer Apps</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Reference clients that use the same consumer API docs published in this portal.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {apps.map((app) => (
          <article key={app.title} className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <p className="text-xs uppercase tracking-wide text-cyan-300">{app.platform}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-100">{app.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{app.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
