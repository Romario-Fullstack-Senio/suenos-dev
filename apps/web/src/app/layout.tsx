import type { Metadata, Viewport } from 'next';
import { Manrope, JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Sky } from '@/components/layout/Sky';
import { CookieConsent } from '@/components/CookieConsent';
import { TitleLock } from '@/components/TitleLock';
import { ReferralCapture } from '@/components/ReferralCapture';

// Aplica la clase .dark a <html> ANTES del primer paint (localStorage no es
// accesible durante el render en servidor), para que no haya un flash de
// tema incorrecto al cargar. Debe ser síncrono y correr en <head>.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('suenos-theme');var dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark');}catch(e){}})();`;

// Autohospedadas y precargadas por Next: no bloquean el render ni producen
// el salto de fuente que daba el @import de Google Fonts en globals.css.
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // El pedido es que la pestaña SIEMPRE diga "Sueños Dev", sin importar la
  // página — TitleLock (client-side, ver layout más abajo) es lo que
  // realmente lo garantiza después de la hidratación. Este `title` es solo
  // lo que se ve en el HTML servido antes de que React hidrate (y lo que
  // usan buscadores/redes sociales al leer el <head> crudo) — sin
  // `template`, para no heredar el "%s" de las páginas que definen su
  // propio título vía generateMetadata.
  title: 'Sueños Dev',
  description: 'Aprende desarrollo web con cursos prácticos, videos en streaming y certificados verificables.',
  openGraph: {
    siteName: 'Sueños Dev',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
  },
  // manifest.ts ya genera /manifest.webmanifest y su <link> solo — esto es
  // lo que falta para que además el <head> tenga favicon/apple-touch-icon
  // (Next no los infiere del manifest, hay que declararlos acá).
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

// theme_color vive acá (no en `metadata`) desde Next 14 — es lo que pinta
// la barra de estado del navegador/SO cuando la PWA está instalada.
export const viewport: Viewport = {
  themeColor: '#d97706',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${manrope.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="relative min-h-screen overflow-x-hidden bg-cloud-50 text-ink">
        <ThemeProvider>
          <TitleLock />
          <Suspense fallback={null}>
            <ReferralCapture />
          </Suspense>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
