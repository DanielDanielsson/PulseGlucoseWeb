import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell-container shell-container--wide site-footer__inner">
        <div>
          <p className="site-footer__title">PulseGlucoseWeb</p>
          <p className="site-footer__copy">Public docs, app references, and machine readable contracts.</p>
        </div>

        <div className="site-footer__links">
          <Link href="/docs">Docs</Link>
          <Link href="/apps">Apps</Link>
          <a href="https://glucose-nu.vercel.app/status">API Status</a>
          <Link href="/agents">Agent Context</Link>
        </div>
      </div>
    </footer>
  );
}
