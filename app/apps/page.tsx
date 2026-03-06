const apps = [
  {
    title: 'Web Dashboard',
    platform: 'Web',
    description: 'Real time browser dashboard with share source glucose and notification stream support.'
  },
  {
    title: 'PulseBar',
    platform: 'macOS menubar',
    description: 'Desktop menubar monitor with quick glance glucose state, trend arrows, and alert support.'
  },
  {
    title: 'CLI Watcher',
    platform: 'CLI',
    description: 'Terminal mode workflow for polling, alerts, and local automation scripts.'
  },
  {
    title: 'Raspberry Pi Display',
    platform: 'Embedded',
    description: 'Low power always on display mode with reconnect strategy and local cache.'
  }
];

export const metadata = {
  title: 'Apps',
  description: 'Consumer app landscape for PulseGlucose integrations.'
};

export default function AppsPage() {
  return (
    <main className="page-frame">
      <div className="shell-container section-stack">
        <section className="panel hero-card">
          <span className="eyebrow">Consumer apps</span>
          <h1 className="section-title mt-6">One API surface. Multiple client forms.</h1>
          <p className="section-copy mt-6">
            The same consumer contract can power browsers, menu bar apps, terminals, and ambient displays.
            The app layer changes. The source strategy and integration rules stay consistent.
          </p>
        </section>

        <section className="apps-grid">
          {apps.map((app) => (
            <article key={app.title} className="panel inline-card">
              <p className="kicker">{app.platform}</p>
              <h2 className="inline-card__title mt-3 text-2xl">{app.title}</h2>
              <p className="inline-card__copy">{app.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
