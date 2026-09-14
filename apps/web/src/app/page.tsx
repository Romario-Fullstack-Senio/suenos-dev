import Link from 'next/link';
import { PlayCircle, CircleDashed, BadgeCheck } from 'lucide-react';
import { HeroCta } from '@/components/HeroCta';
import { CourseCard } from '@/components/CourseCard';
import { API_URL } from '@/lib/api';

const FEATURES = [
  {
    Icon: PlayCircle,
    bg: 'bg-primary/10',
    color: 'text-primary',
    title: 'Cursos en video',
    desc: 'Aprende con proyectos prácticos y videos en alta calidad.',
  },
  {
    Icon: CircleDashed,
    bg: 'bg-secondary/10',
    color: 'text-secondary',
    title: 'Progreso guardado',
    desc: 'Tu avance se guarda automáticamente. Continúa donde lo dejaste.',
  },
  {
    Icon: BadgeCheck,
    bg: 'bg-accent/10',
    color: 'text-accent',
    title: 'Certificado verificable',
    desc: 'Obtén un certificado PDF con código de verificación único.',
  },
];

interface CursoDestacado {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  categoria?: string;
  instructorNombre?: string;
  alumnosInscriptos?: number;
  esOficial?: boolean;
  esNuevo?: boolean;
}

/**
 * Cursos reales para la home. Antes la landing no mostraba un solo curso: el
 * producto recién aparecía después de un click a /cursos. Se pide en el
 * servidor con revalidate para no sumar JS ni una cascada en el cliente, y
 * si el API no responde la sección simplemente no se renderiza (la home
 * nunca cae por esto).
 */
async function getDestacados(): Promise<{ cursos: CursoDestacado[]; total: number }> {
  try {
    const res = await fetch(`${API_URL}/cursos?limit=3`, { next: { revalidate: 300 } });
    if (!res.ok) return { cursos: [], total: 0 };
    const data = await res.json();
    return { cursos: data.cursos ?? [], total: data.total ?? 0 };
  } catch {
    return { cursos: [], total: 0 };
  }
}

export default async function HomePage() {
  const { cursos, total } = await getDestacados();

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-28 pt-24 text-center">
      <span className="mb-9 inline-flex items-center gap-2.5 rounded-full border border-ink/[0.08] bg-cloud-50 px-4 py-2.5 text-sm font-semibold text-ink-muted"
        style={{ boxShadow: '0 12px 30px -14px rgba(20,22,43,0.22)' }}
      >
        <BadgeCheck className="h-4 w-4 text-primary" aria-hidden />
        Proyectos reales y certificados verificables
      </span>

      <h1 className="max-w-4xl text-6xl font-extrabold leading-[1.04] tracking-tight text-ink md:text-[76px]">
        Donde los <span className="text-primary">sueños</span> se convierten en{' '}
        <span className="text-secondary">código</span>
      </h1>

      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-muted">
        Cursos de desarrollo con proyectos reales y certificados verificables.
      </p>

      <HeroCta />

      {cursos.length > 0 && (
        <section className="mt-24 w-full max-w-5xl text-left">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Cursos destacados</h2>
            <Link href="/cursos" className="text-sm font-semibold">
              {total > cursos.length ? `Ver los ${total} cursos` : 'Ver todo el catálogo'} →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {cursos.map((curso) => (
              <CourseCard key={curso.id} curso={curso} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-24 grid w-full max-w-5xl gap-6 text-left md:grid-cols-3">
        {FEATURES.map(({ Icon, ...f }) => (
          <div key={f.title} className="card p-8">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${f.bg}`}>
              <Icon className={`h-5 w-5 ${f.color}`} aria-hidden />
            </div>
            <h3 className="mb-2 text-lg font-bold text-ink">{f.title}</h3>
            <p className="text-[15px] leading-relaxed text-ink-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
