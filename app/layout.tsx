import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500']
});

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem('pulse-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : systemDark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pulse-glucose-web.vercel.app'),
  title: {
    default: 'PulseGlucoseWeb',
    template: '%s | PulseGlucoseWeb'
  },
  description:
    'PulseGlucose platform hub with API docs, integration guidance, and app ecosystem overview for human developers and agents.',
  openGraph: {
    title: 'PulseGlucoseWeb',
    description: 'Product portal and public API docs for PulseGlucose ecosystem.',
    type: 'website'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" className={`${spaceGrotesk.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className="font-[var(--font-space-grotesk)] antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <div className="app-shell">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
