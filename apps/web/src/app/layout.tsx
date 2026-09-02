import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Sueños Dev - Donde los sueños se convierten en código',
  description: 'Aprende ingeniería de sistemas con proyectos reales. De principiante a profesional en meses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-suenos-midnight text-suenos-text antialiased">
        <AuthProvider>
          <Header />
          <main className="pt-16">{children}</main>
        </AuthProvider>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#111631',
              border: '1px solid #252B4A',
              color: '#F1F5F9',
            },
          }}
        />
      </body>
    </html>
  );
}
