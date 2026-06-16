import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Facebook, Instagram } from 'lucide-react';

export const metadata: Metadata = {
  title: 'COPASTUNTF2R-NITROX',
  description: 'Inscripciones Oficiales a la Copa Stunt F2R Repuestos Nitrox. Vive una experiencia increíble.',
  openGraph: {
    title: 'COPASTUNTF2R-NITROX',
    description: 'Inscripciones Oficiales a la Copa Stunt F2R Repuestos Nitrox. Vive una experiencia increíble y participa en la rifa de una MRX 200.',
    url: 'https://paskinesstunt.com/',
    siteName: 'Copa Stunt F2R',
    images: [
      {
        url: 'https://paskinesstunt.com/sponsors/stunt2026negro.jpeg',
        width: 1200,
        height: 1200,
        alt: 'COPA STUNT F2R - NITROX',
      },
    ],
    locale: 'es_CO',
    type: 'website',
  },
  icons: {
    icon: '/sponsors/stunt2026negro.jpeg',
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
