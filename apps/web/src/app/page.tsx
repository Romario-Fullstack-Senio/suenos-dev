import Link from 'next/link';

const FEATURES = [
  {
    icon: '▶',
    bg: 'bg-indigo-50',
    title: 'Cursos en video',
    desc: 'Aprende con proyectos prácticos y videos en alta calidad.',
  },
  {
    icon: '◐',
    bg: 'bg-violet-50',
    title: 'Progreso guardado',
    desc: 'Tu avance se guarda automáticamente. Continúa donde lo dejaste.',
  },
  {
    icon: '✦',
    bg: 'bg-amber-50',
    title: 'Certificado verificable',
    desc: 'Obtén un certificado PDF con código de verificación único.',
  },
];

const STATS = [
  { valor: '+120', etiqueta: 'Cursos y rutas' },
  { valor: '+18k', etiqueta: 'Estudiantes activos' },
  { valor: '94%', etiqueta: 'Terminan su ruta' },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-28 pt-24 text-center">
      <span className="mb-9 inline-flex items-center gap-2.5 rounded-full border border-ink/[0.08] bg-white px-4.5 py-2.5 text-sm font-semibold text-ink-muted"
        style={{ boxShadow: '0 12px 30px -14px rgba(20,22,43,0.22)' }}
      >
        <span className="text-accent">✦</span>
        Plataforma de e-learning #1 en LATAM
      </span>

      <h1 className="max-w-4xl text-6xl font-extrabold leading-[1.04] tracking-tight text-ink md:text-[76px]">
        Donde los <span className="text-primary">sueños</span> se convierten en{' '}
        <span className="text-accent">código</span>
      </h1>

      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-muted">
        Cursos de desarrollo con proyectos reales, videos en streaming y certificados verificables.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-3.5">
        <Link href="/dashboard" className="btn-primary text-[17px]">
          Ir a mi panel <span aria-hidden>→</span>
        </Link>
        <Link href="/cursos" className="btn-ghost text-[17px]">
          Explorar cursos
        </Link>
      </div>

      <div className="mt-24 grid w-full max-w-5xl gap-6 text-left md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-8">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${f.bg}`}>
              {f.icon}
            </div>
            <h3 className="mb-2 text-lg font-bold text-ink">{f.title}</h3>
            <p className="text-[15px] leading-relaxed text-ink-muted">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 flex w-full max-w-3xl flex-wrap justify-center gap-14 border-t border-ink/[0.07] pt-10">
        {STATS.map((s) => (
          <div key={s.etiqueta} className="flex flex-col gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-ink">{s.valor}</span>
            <span className="text-sm font-semibold text-ink-soft">{s.etiqueta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
