'use client';

/**
 * DreamSky — el motivo visual de marca: un cielo nocturno con estrellas
 * y nubes de ensueño (blobs suaves y difuminados en los colores de marca)
 * flotando y desplazándose lentamente. Representa "sueños" de forma literal
 * sin caer en un ícono de nube plano.
 *
 * Todas las posiciones son deterministas (generadas con un PRNG con semilla fija
 * en tiempo de carga del módulo) para que el render de servidor y cliente
 * coincidan exactamente y no haya parpadeos de hidratación.
 */

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(1985);

const STARS = Array.from({ length: 60 }, () => ({
  left: rand() * 100,
  top: rand() * 100,
  delay: rand() * 4,
  opacity: 0.2 + rand() * 0.5,
  big: rand() > 0.88,
}));

type Tone = 'violet' | 'cyan' | 'gold' | 'moon';

const TONE_GRADIENTS: Record<Tone, string> = {
  violet: 'from-suenos-violet/45 via-suenos-violet-light/20 to-transparent',
  cyan: 'from-suenos-cyan/40 via-suenos-cyan-light/20 to-transparent',
  gold: 'from-suenos-gold/35 via-suenos-gold-light/15 to-transparent',
  moon: 'from-suenos-moon/35 via-suenos-moon/10 to-transparent',
};

interface CloudSpec {
  size: number;
  top: string;
  left: string;
  tone: Tone;
  driftDelay: string;
  driftDuration: string;
  floatDelay: string;
}

const DEFAULT_CLOUDS: CloudSpec[] = [
  { size: 380, top: '8%', left: '4%', tone: 'violet', driftDelay: '0s', driftDuration: '24s', floatDelay: '0s' },
  { size: 280, top: '52%', left: '74%', tone: 'cyan', driftDelay: '-6s', driftDuration: '28s', floatDelay: '1.2s' },
  { size: 220, top: '70%', left: '18%', tone: 'gold', driftDelay: '-12s', driftDuration: '20s', floatDelay: '2.4s' },
  { size: 320, top: '14%', left: '64%', tone: 'moon', driftDelay: '-3s', driftDuration: '26s', floatDelay: '0.6s' },
];

function CloudPuff({ size, top, left, tone, driftDelay, driftDuration, floatDelay }: CloudSpec) {
  const gradient = TONE_GRADIENTS[tone];
  return (
    <div
      className="absolute animate-drift"
      style={{ top, left, animationDelay: driftDelay, animationDuration: driftDuration }}
    >
      <div className="animate-float" style={{ animationDelay: floatDelay }}>
        <div className="relative" style={{ width: size, height: size * 0.6 }}>
          <div className={`absolute inset-[10%] rounded-full bg-gradient-radial ${gradient} blur-2xl`} />
          <div className={`absolute left-0 top-[15%] w-[60%] h-[70%] rounded-full bg-gradient-radial ${gradient} blur-2xl`} />
          <div className={`absolute right-0 top-[5%] w-[55%] h-[75%] rounded-full bg-gradient-radial ${gradient} blur-2xl`} />
        </div>
      </div>
    </div>
  );
}

export function DreamSky({
  clouds = DEFAULT_CLOUDS,
  showStars = true,
  className = '',
}: {
  clouds?: CloudSpec[];
  showStars?: boolean;
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {showStars &&
        STARS.map((s, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-suenos-text animate-star-twinkle ${s.big ? 'w-1 h-1' : 'w-0.5 h-0.5'}`}
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              animationDelay: `${s.delay}s`,
              opacity: s.opacity,
            }}
          />
        ))}
      {clouds.map((c, i) => (
        <CloudPuff key={i} {...c} />
      ))}
    </div>
  );
}

/** Divisor ondulado en forma de nubes, para transicionar entre secciones. */
export function CloudDivider({ className = '', fillClassName = 'fill-suenos-deep' }: { className?: string; fillClassName?: string }) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={`absolute bottom-0 left-0 w-full h-16 sm:h-24 ${className}`}
      aria-hidden="true"
    >
      <path
        className={fillClassName}
        d="M0,64 C120,100 240,20 360,56 C480,92 600,24 720,52 C840,80 960,20 1080,48 C1200,76 1320,24 1440,56 L1440,120 L0,120 Z"
      />
    </svg>
  );
}
