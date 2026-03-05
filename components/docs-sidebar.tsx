import Link from 'next/link';

interface DocsSidebarProps {
  groups: Array<{
    name: string;
    endpoints: Array<{ id: string; method: string; path: string }>;
  }>;
}

const CORE_DOC_LINKS = [
  { href: '/docs', label: 'Overview' },
  { href: '/docs/getting-started', label: 'Getting Started' },
  { href: '/docs/authentication', label: 'Authentication' },
  { href: '/docs/workflows', label: 'Workflows' },
  { href: '/docs/endpoints', label: 'Endpoint Index' },
  { href: '/docs/errors', label: 'Errors' }
];

export function DocsSidebar({ groups }: DocsSidebarProps) {
  return (
    <aside className="sticky top-20 space-y-6">
      <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Documentation</p>
        <nav className="mt-3 space-y-2">
          {CORE_DOC_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-2 py-1.5 text-sm text-slate-200 transition hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Consumer Endpoints</p>
        <div className="mt-3 space-y-4">
          {groups.map((group) => (
            <div key={group.name}>
              <p className="text-xs font-semibold text-cyan-300">{group.name}</p>
              <ul className="mt-2 space-y-1">
                {group.endpoints.slice(0, 8).map((endpoint) => (
                  <li key={endpoint.id}>
                    <Link
                      href={`/docs/endpoints/${endpoint.id}`}
                      className="block rounded-md px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                    >
                      <span className="font-mono text-slate-400">{endpoint.method}</span> {endpoint.path}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
