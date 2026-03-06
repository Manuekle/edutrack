import { PWAInstaller } from '@/components/pwa-installer';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import { Toaster } from 'sileo';
import './globals.css';
import Providers from './providers';

const siteUrl = 'https://sira-fup.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SIRA - Sistema Integral de Registro Académico',
    template: `%s | SIRA`,
  },
  description:
    'Sistema Integral de Registro Académico para la gestión automatizada de asistencias.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SIRA - Sistema Integral de Registro Académico',
    description: 'Sistema Integral de Registro Académico para la FUP.',
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
  manifest: '/manifest.json',
  other: {
    'msapplication-config': '/icons/browserconfig.xml',
    'msapplication-TileColor': '#6366F1',
    'msapplication-TileImage': '/icons/mstile-144x144.png',
    'theme-color': '#6366F1',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
} as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
      style={{ colorScheme: 'dark' }}
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('ServiceWorker registered: ', registration.scope);
                    })
                    .catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Saltar al contenido principal
        </a>
        <Providers>
          {children}
          <PWAInstaller />
          <Toaster
            position="top-right"
            theme="dark"
            options={{
              fill: "#171717",
              roundness: 16,
              styles: {
                title: "text-white font-medium!",
                description: "text-white/70!",
                badge: "bg-white/10!",
                button: "bg-white/10! hover:bg-white/20! transition-colors",
              }
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
