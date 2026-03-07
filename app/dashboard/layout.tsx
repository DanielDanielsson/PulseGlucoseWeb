import Link from 'next/link';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { DashboardGlucoseBadge } from '@/components/glucose/dashboard-glucose-badge';
import { requireOwnerSession } from '@/lib/auth';
import { fetchConsumerProfile } from '@/lib/pulse-api/client';

const DASHBOARD_LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/glucose', label: 'Glucose' },
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/dashboard/integrations', label: 'Integrations' },
  { href: '/dashboard/api-keys', label: 'API Keys' }
] as const;

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireOwnerSession();
  let greetingName: string | null = null;

  try {
    const { profile } = await fetchConsumerProfile();
    const firstName = profile.firstName.trim();
    const displayName = profile.displayName.trim();
    greetingName = firstName || displayName.split(/\s+/)[0] || null;
  } catch {
    greetingName = null;
  }

  return (
    <main className="page-frame">
      <div className="dashboard-fullwidth-container section-stack">
        <section className="panel dashboard-hero">
          <div className="dashboard-hero__header">
            <div className="dashboard-hero__copy">
              <p className="kicker">PulseGlucose owner dashboard</p>
              <h1 className="dashboard-hero__title">{greetingName ? `Hi, ${greetingName}!` : 'Hi!'}</h1>
              <p className="dashboard-hero__lede">Control the API from the web app.</p>
              <p className="dashboard-hero__meta">Signed in as {session.user?.email}</p>
            </div>
            <div className="dashboard-hero__actions">
              <DashboardGlucoseBadge />
              <span className="data-chip">Owner session</span>
              <SignOutButton />
            </div>
          </div>

          <nav className="dashboard-nav">
            {DASHBOARD_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="button-secondary">
                {link.label}
              </Link>
            ))}
          </nav>
        </section>

        {children}
      </div>
    </main>
  );
}
