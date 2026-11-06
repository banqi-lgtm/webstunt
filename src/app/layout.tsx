import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Facebook, Instagram } from 'lucide-react';

export const metadata: Metadata = {
  title: 'BTL & STUNT COL',
  description: 'Paskines Stunt (PKS) es la productora de eventos BTL y experiencias de stunt más importante de Colombia. Conectamos marcas, pilotos y audiencia.',
  verification: {
    other: {
      'facebook-domain-verification': 'j6hpjkw3a5ip3uvkppvtmp6ny7fwm9',
    },
  },
  openGraph: {
    title: 'BTL & STUNT COL',
    description: 'Paskines Stunt (PKS) es la productora líder en eventos BTL, activaciones de marca y campeonatos de stunt en Colombia. Regístrate en nuestro ecosistema digital.',
    url: 'https://paskinesstunt.com/',
    siteName: 'Paskines Stunt',
    images: [
      {
        url: 'https://paskinesstunt.com/sponsors/PKS Blanco.png',
        width: 1200,
        height: 1200,
        alt: 'Paskines Stunt',
      },
    ],
    locale: 'es_CO',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon.png?v=7', type: 'image/png' },
      { url: '/favicon.ico?v=7', sizes: 'any' },
      { url: '/sponsors/PKS Negro.png?v=7', type: 'image/png' }
    ],
    shortcut: '/favicon.png?v=7',
    apple: '/favicon.png?v=7',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" translate="no" className="dark">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png?v=7" />
        <link rel="apple-touch-icon" href="/favicon.png?v=7" />
        <meta name="facebook-domain-verification" content="j6hpjkw3a5ip3uvkppvtmp6ny7fwm9" />
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Oswald:wght@700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-inter bg-[#080808] text-white antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
