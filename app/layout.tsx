import { PWAInstaller } from '@/components/pwa-installer';
import { StructuredData } from '@/components/structured-data';
import { SileoToaster } from '@/components/ui/sileo-toaster';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

const siteUrl = 'https://sira-fup.online';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'SIRA',
  authors: [{ name: 'FUP Dev Team', url: 'https://fup.edu.co' }],
  generator: 'Next.js',
  keywords: [
    'SIRA',
    'FUP',
    'asistencia',
    'gestión académica',
    'QR',
    'estudiantes',
    'docentes',
    'Popayán',
  ],
  referrer: 'origin-when-cross-origin',
  themeColor: '#6366F1',
  colorScheme: 'light dark',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  creator: 'Fundación Universitaria de Popayán',
  publisher: 'Fundación Universitaria de Popayán',
  category: 'education',
  title: {
    default: 'SIRA - Sistema Integral de Registro Académico',
    template: `%s | SIRA`,
  },
  description:
    'Sistema Integral de Registro Académico para la gestión automatizada de asistencias mediante códigos QR.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SIRA - Sistema Integral de Registro Académico',
    description: 'Gestiona tus asistencias de forma rápida y segura con códigos QR.',
    url: siteUrl,
    siteName: 'SIRA FUP',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'SIRA - Sistema Integral de Registro Académico',
      },
    ],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIRA - Sistema Integral de Registro Académico',
    description: 'Gestión de asistencias con códigos QR para la FUP.',
    images: ['/og-image.webp'],
    creator: '@fup_oficial',
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
        color: '#6366F1',
      },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SIRA',
  },
  other: {
    'msapplication-config': '/icons/browserconfig.xml',
    'msapplication-TileColor': '#6366F1',
    'msapplication-TileImage': '/icons/mstile-144x144.png',
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
        <StructuredData />
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
          <SileoToaster />
        </Providers>
      </body>
    </html>
  );
}
