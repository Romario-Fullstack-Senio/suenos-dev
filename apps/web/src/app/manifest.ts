import { MetadataRoute } from 'next';

// Next.js App Router: este archivo genera /manifest.webmanifest solo y
// Next agrega el <link rel="manifest"> automáticamente — no hace falta
// tocar layout.tsx para eso. Con esto + los íconos, el navegador ofrece
// "Instalar app" / "Agregar a la pantalla de inicio".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sueños Dev - Plataforma de E-Learning',
    short_name: 'Sueños Dev',
    description: 'Aprendé desarrollo web con cursos prácticos y certificados verificables.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0e1a',
    theme_color: '#6366f1',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
