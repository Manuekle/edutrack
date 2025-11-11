import { Toaster } from '@/components/ui/sonner';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

const siteUrl = 'https://edutrack-fup.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Sistema de Asistencias FUP',
    template: `%s | Asistencias FUP`,
  },
  description:
    'Optimiza la gestión de asistencias en la FUP con códigos QR. Eficiencia para docentes y estudiantes.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sistema de Asistencias FUP',
    description: 'Gestión de asistencias con códigos QR.',
    url: siteUrl,
    siteName: 'Asistencias FUP',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Banner del Sistema de Asistencias FUP',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sistema de Asistencias FUP',
    description: 'Gestión de asistencias con códigos QR.',
    images: ['/og-image.webp'],
    site: '@fup_asistencias_docente',
  },
  verification: {
    google: '0RPzGmepK5heQ-2axeEVsJ9o2FVPXcNp67TZSjmjF0E',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/icons/apple-touch-icon.png',
      },
      {
        rel: 'mask-icon',
        url: '/icons/safari-pinned-tab.svg',
        color: '#000000',
      },
    ],
  },
  manifest: '/icons/manifest.json',
  other: {
    'msapplication-config': '/icons/browserconfig.xml',
    'msapplication-TileColor': '#ffffff',
    'msapplication-TileImage': '/icons/mstile-144x144.png',
    'theme-color': '#ffffff',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster position="top-center" duration={5000} />
        </Providers>
      </body>
    </html>
  );
}
