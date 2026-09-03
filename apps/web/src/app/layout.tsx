import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sky } from '@/components/layout/Sky';

export const metadata: Metadata = {
  title: 'Suenos Dev - Plataforma de E-Learning',
  description: 'Aprende desarrollo web con cursos practicos y certificados verificables.',
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
          <Header />
          <main className="relative z-[1]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
