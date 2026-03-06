import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/api', label: 'API' },
  { href: '/apps', label: 'Apps' },
  { href: '/docs', label: 'Docs' },
  { href: '/agents', label: 'Agents' }
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell-container site-header__inner">
        <Link href="/" className="site-brand">
          <span className="site-brand__pulse" />
          <span>
            <span className="site-brand__name">PulseGlucose</span>
            <span className="site-brand__sub">clean docs for live glucose apps</span>
          </span>
        </Link>

        <div className="site-header__actions">
          <nav className="site-nav" aria-label="Primary">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="site-nav__link">
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
