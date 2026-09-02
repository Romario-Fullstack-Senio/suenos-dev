'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DreamSky, CloudDivider } from '@/components/decorative/DreamSky';
import {
  Code,
  Cloud,
  Smartphone,
  Database,
  Brain,
  Trophy,
  Users,
  Star,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
  Heart,
  ChevronRight,
  Play,
} from 'lucide-react';

const CATEGORIES = [
  { icon: Code, label: 'Frontend', desc: 'React, Vue, Angular', color: 'text-suenos-cyan' },
  { icon: Database, label: 'Backend', desc: 'Node, Python, Java', color: 'text-suenos-violet-light' },
  { icon: Cloud, label: 'Cloud & DevOps', desc: 'AWS, Docker, CI/CD', color: 'text-suenos-gold' },
  { icon: Smartphone, label: 'Mobile', desc: 'React Native, Flutter', color: 'text-suenos-cyan-light' },
  { icon: Brain, label: 'IA & Data', desc: 'ML, Python, Analytics', color: 'text-suenos-violet' },
  { icon: Zap, label: 'Bases de Datos', desc: 'SQL, NoSQL, Modelado', color: 'text-suenos-gold-light' },
];

const COURSES = [
  {
    titulo: 'Desarrollo Fullstack con NestJS',
    instructor: 'Romario Gonzalez',
    nivel: 'Intermedio',
    duracion: '40h',
    precio: '$49.99',
    rating: 4.9,
    estudiantes: 1240,
    tag: 'Mas vendido',
    slug: 'nestjs-desde-cero',
  },
  {
    titulo: 'Testing Automatizado con Playwright',
    instructor: 'Romario Gonzalez',
    nivel: 'Avanzado',
    duracion: '25h',
    precio: '$29.99',
    rating: 4.8,
    estudiantes: 860,
    tag: 'Nuevo',
    slug: 'playwright-testing',
  },
  {
    titulo: 'React desde Cero',
    instructor: 'Romario Gonzalez',
    nivel: 'Inicial',
    duracion: '35h',
    precio: '$39.99',
    rating: 4.9,
    estudiantes: 2100,
    tag: 'Popular',
    slug: 'react-desde-cero',
  },
];

const TESTIMONIOS = [
  {
    nombre: 'Maria Fernandez',
    rol: 'Frontend Developer en MercadoLibre',
    texto: 'Empecé sin saber nada de programación. Hoy trabajo en una de las empresas más grandes de LATAM. Sueños Dev cambió mi vida.',
    avatar: 'MF',
  },
  {
    nombre: 'Carlos Mendoza',
    rol: 'Backend Developer en Rappi',
    texto: 'Los proyectos prácticos me dieron la confianza que necesitaba. En 6 meses pasé de vender en retail a programar profesionalmente.',
    avatar: 'CM',
  },
  {
    nombre: 'Laura Gutierrez',
    rol: 'DevOps Engineer en Globant',
    texto: 'La comunidad de Sueños Dev me apoyó en cada paso. No es solo una plataforma, es un ecosistema que realmente te impulsa.',
    avatar: 'LG',
  },
];

const STATS = [
  { value: '15,000+', label: 'Estudiantes activos' },
  { value: '94%', label: 'Tasa de empleabilidad' },
  { value: '200+', label: 'Horas de contenido' },
  { value: '4.9', label: 'Calificación promedio' },
];

// Formateo manual (sin Intl/toLocaleString): el ICU del Node del servidor
// puede no coincidir con el del navegador y produce mismatches de hidratación.
function formatMiles(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function LandingPage() {
  const { isAuthenticated, hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-suenos-midnight">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <DreamSky />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-suenos-surface/80 border border-suenos-border rounded-full px-4 py-2 mb-8 opacity-0 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-suenos-gold" />
            <span className="text-sm text-suenos-muted font-medium">Plataforma de e-learning #1 en LATAM</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 opacity-0 animate-fade-in-up-delay">
            Donde los{' '}
            <span className="gradient-text">sueños</span>
            <br />
            se convierten en{' '}
            <span className="gradient-text-gold">código</span>
          </h1>

          <p className="text-lg sm:text-xl text-suenos-muted max-w-2xl mx-auto mb-10 text-balance opacity-0 animate-fade-in-up-delay-2">
            Aprende ingeniería de sistemas con proyectos reales.
            <br className="hidden sm:block" />
            De principiante a profesional en meses, no en años.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up-delay-2">
            {isAuthenticated ? (
              <Link
                href={hasRole('admin') ? '/admin' : hasRole('instructor') ? '/instructor' : '/dashboard'}
                className="btn-primary text-lg inline-flex items-center justify-center gap-2"
              >
                Ir a mi panel
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/registro"
                  className="btn-primary text-lg inline-flex items-center justify-center gap-2"
                >
                  Comenzar gratis
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/cursos"
                  className="btn-secondary text-lg inline-flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Ver cursos
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-suenos-dim rotate-90" />
        </div>

        <CloudDivider />
      </section>

      {/* Stats */}
      <section className="relative border-b border-suenos-border bg-suenos-deep">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-suenos-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-suenos-cyan font-mono text-sm tracking-wider uppercase">Especialízate</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 mb-4">
              Elige tu camino
            </h2>
            <p className="text-suenos-muted max-w-lg mx-auto">
              Cada ruta está diseñada con proyectos reales que las empresas realmente buscan en sus candidatos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  href="/cursos"
                  className="card-suenos p-6 group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl bg-suenos-surface flex items-center justify-center mb-4 ${cat.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-1">{cat.label}</h3>
                  <p className="text-sm text-suenos-muted">{cat.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="divider-glow" />

      {/* Cursos destacados */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <span className="text-suenos-violet-light font-mono text-sm tracking-wider uppercase">Destacados</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
                Cursos que transforman carreras
              </h2>
            </div>
            <Link href="/cursos" className="btn-ghost inline-flex items-center gap-1 text-suenos-violet-light hover:text-suenos-violet">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSES.map((curso) => (
              <Link
                key={curso.slug}
                href={`/cursos/${curso.slug}`}
                className="card-suenos overflow-hidden group"
              >
                {/* Color accent bar */}
                <div className="h-1 bg-gradient-to-r from-suenos-violet via-suenos-cyan to-suenos-gold" />

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-mono font-medium bg-suenos-violet/20 text-suenos-violet-light px-2 py-1 rounded-md">
                      {curso.tag}
                    </span>
                    <span className="text-xs text-suenos-dim">{curso.nivel}</span>
                  </div>

                  <h3 className="font-display text-lg font-semibold mb-3 group-hover:text-suenos-cyan transition-colors">
                    {curso.titulo}
                  </h3>

                  <p className="text-sm text-suenos-muted mb-4">por {curso.instructor}</p>

                  <div className="flex items-center gap-4 text-sm text-suenos-muted mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-suenos-gold fill-suenos-gold" />
                      {curso.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {formatMiles(curso.estudiantes)}
                    </span>
                    <span>{curso.duracion}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-suenos-border">
                    <span className="font-display text-xl font-bold gradient-text-gold">{curso.precio}</span>
                    <span className="text-sm text-suenos-violet-light group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Inscribirme <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-glow" />

      {/* Testimonios */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-suenos-gold font-mono text-sm tracking-wider uppercase">Historias reales</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 mb-4">
              Ellos lo lograron
            </h2>
            <p className="text-suenos-muted max-w-lg mx-auto">
              Cada historia es alguien que decidió dar el paso. Hoy trabajan en las tech companies más demandadas de Latinoamérica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIOS.map((t) => (
              <div key={t.nombre} className="card-suenos p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-suenos-gold fill-suenos-gold" />
                  ))}
                </div>
                <p className="text-suenos-text mb-6 leading-relaxed">&ldquo;{t.texto}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-suenos-violet to-suenos-cyan flex items-center justify-center text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.nombre}</p>
                    <p className="text-xs text-suenos-muted">{t.rol}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-suenos p-12 sm:p-16 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-suenos-violet/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <Trophy className="w-12 h-12 text-suenos-gold mx-auto mb-6" />
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Tu futuro en tecnología{' '}
                <span className="gradient-text">empieza hoy</span>
              </h2>
              <p className="text-suenos-muted max-w-lg mx-auto mb-8">
                Únete a los miles de estudiantes que ya están construyendo sus sueños. El primer paso es el más importante.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/registro"
                  className="btn-primary text-lg inline-flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  Crear mi cuenta gratis
                </Link>
                <Link
                  href="/cursos"
                  className="btn-secondary text-lg inline-flex items-center justify-center gap-2"
                >
                  Explorar cursos
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-suenos-border bg-suenos-deep/30">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="font-display text-2xl font-bold gradient-text inline-block mb-4">
                Sueños Dev
              </Link>
              <p className="text-suenos-muted text-sm max-w-sm leading-relaxed">
                La plataforma de e-learning donde los sueños de convertirte en desarrollador se hacen realidad. Aprende con proyectos reales, mentores expertos y una comunidad que te impulsa.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-suenos-text">Plataforma</h4>
              <ul className="space-y-2 text-sm text-suenos-muted">
                <li><Link href="/cursos" className="hover:text-suenos-cyan transition-colors">Cursos</Link></li>
                <li><Link href="/auth/login" className="hover:text-suenos-cyan transition-colors">Iniciar sesión</Link></li>
                <li><Link href="/auth/registro" className="hover:text-suenos-cyan transition-colors">Registrarse</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-suenos-text">Comunidad</h4>
              <ul className="space-y-2 text-sm text-suenos-muted">
                <li><span className="hover:text-suenos-cyan transition-colors cursor-pointer">Discord</span></li>
                <li><span className="hover:text-suenos-cyan transition-colors cursor-pointer">GitHub</span></li>
                <li><span className="hover:text-suenos-cyan transition-colors cursor-pointer">Blog</span></li>
              </ul>
            </div>
          </div>
          <div className="divider-glow my-8" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-suenos-dim">
            <p>&copy; 2026 Sueños Dev. Todos los derechos reservados.</p>
            <p className="flex items-center gap-1">
              Hecho con <Heart className="w-3 h-3 text-suenos-violet fill-suenos-violet" /> en LATAM
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
