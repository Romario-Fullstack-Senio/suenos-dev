import { ImageResponse } from 'next/og';

/**
 * Imagen OG del sitio. El layout ya declaraba `twitter: summary_large_image`
 * pero no había ninguna imagen: todo link compartido salía como una tarjeta
 * gris sin nada. Las páginas de curso usan la portada del curso cuando
 * existe (ver generateMetadata en cursos/[slug]); esta es el fallback para
 * la home y el resto de las rutas.
 */
export const runtime = 'edge';
export const alt = 'Sueños Dev — Donde los sueños se convierten en código';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0b0e1a',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: 'linear-gradient(140deg,#fbbf24,#d97706)',
            }}
          />
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#f1f5f9' }}>
            Sueños Dev
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            color: '#f1f5f9',
            maxWidth: 900,
          }}
        >
          Donde los sueños se convierten en código
        </div>

        <div style={{ display: 'flex', marginTop: 40, fontSize: 30, color: '#94a3b8' }}>
          Cursos con proyectos reales y certificados verificables
        </div>
      </div>
    ),
    size,
  );
}
