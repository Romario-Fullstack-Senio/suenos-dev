import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Sky } from '@/components/layout/Sky';
import { CookieConsent } from '@/components/CookieConsent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Sueños Dev - Plataforma de E-Learning',
    template: '%s | Sueños Dev',
  },
  description: 'Aprende desarrollo web con cursos practicos y certificados verificables.',
  openGraph: {
    siteName: 'Sueños Dev',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="relative min-h-screen overflow-x-hidden bg-white text-ink">
        <Sky />
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="relative z-[1]">{children}</main>
            <Footer />
            <CookieConsent />
          </CartProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
