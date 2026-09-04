const STARS = [
  { left: '8%', top: '110px', size: 5, color: '#8b5cf6', opacity: 0.5 },
  { left: '20%', top: '82px', size: 3, color: '#6366f1', opacity: 0.7 },
  { left: '31%', top: '196px', size: 4, color: '#f59e0b', opacity: 0.6 },
  { left: '44%', top: '120px', size: 3, color: '#8b5cf6', opacity: 0.45 },
  { left: '57%', top: '174px', size: 5, color: '#6366f1', opacity: 0.45 },
  { left: '68%', top: '96px', size: 3, color: '#8b5cf6', opacity: 0.5 },
  { left: '78%', top: '262px', size: 4, color: '#6366f1', opacity: 0.5 },
  { left: '88%', top: '340px', size: 3, color: '#f59e0b', opacity: 0.5 },
  { left: '13%', top: '420px', size: 4, color: '#6366f1', opacity: 0.35 },
  { left: '49%', top: '620px', size: 4, color: '#8b5cf6', opacity: 0.35 },
  { left: '72%', top: '560px', size: 3, color: '#f59e0b', opacity: 0.4 },
  { left: '4%', top: '660px', size: 3, color: '#6366f1', opacity: 0.3 },
];

function Cloud({ className, width }: { className: string; width: number }) {
  const puffA = width * 0.42;
  const puffB = width * 0.31;
  return (
    <div
      // En modo oscuro las nubes blancas y opacas desentonan contra el cielo
      // nocturno — se atenúan y oscurecen para leerse como nubes de noche en
      // vez de manchas blancas, con una transición suave al cambiar de tema.
      className={`${className} transition-[opacity,filter] duration-500 dark:opacity-[0.14] dark:brightness-[0.35]`}
      style={{ width, height: puffA, filter: 'drop-shadow(0 26px 40px rgba(99,102,241,0.16))' }}
    >
      <div
        className="absolute rounded-full bg-white"
        style={{ left: width * 0.14, top: 0, width: puffA, height: puffA }}
      />
      <div
        className="absolute rounded-full"
        style={{
          left: width * 0.47,
          top: puffA * 0.23,
          width: puffB,
          height: puffB,
          background: 'linear-gradient(180deg,#ffffff,#f2f4fd)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 rounded-full"
        style={{
          width,
          height: width * 0.24,
          background: 'linear-gradient(180deg,#ffffff,#eceffb)',
        }}
      />
    </div>
  );
}

export function Sky() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* auroras suaves */}
      <div
        className="absolute -left-[8%] -top-[14%] h-[620px] w-[620px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.16),rgba(99,102,241,0) 70%)' }}
      />
      <div
        className="absolute -right-[12%] top-[18%] h-[660px] w-[660px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.13),rgba(139,92,246,0) 70%)' }}
      />
      <div
        className="absolute -bottom-[26%] left-[24%] h-[520px] w-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(245,158,11,0.10),rgba(245,158,11,0) 70%)' }}
      />

      {/* sol / luna — mismo lugar, mismo gesto que el toggle del header: el
          astro que sale se esconde cayendo y desvaneciéndose, el que entra
          sube y aparece. Sol en modo claro, luna (el diseño de siempre) en
          modo oscuro. */}
      <div className="absolute right-[9%] top-[118px] h-[104px] w-[104px]">
        <div
          className="absolute inset-0 rounded-full transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] dark:translate-y-8 dark:scale-50 dark:rotate-45 dark:opacity-0"
          style={{
            background: 'radial-gradient(circle at 35% 30%,#fff7d6,#fbbf24 70%)',
            boxShadow:
              '0 0 0 18px rgba(251,191,36,0.14), 0 0 0 44px rgba(251,191,36,0.07), 0 26px 60px -18px rgba(217,119,6,0.35)',
          }}
        />
        <div
          className="absolute inset-0 rounded-full translate-y-8 scale-50 -rotate-45 opacity-0 transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] dark:translate-y-0 dark:scale-100 dark:rotate-0 dark:opacity-100"
          style={{
            background: 'linear-gradient(150deg,#fffdf5,#f3ecd8)',
            boxShadow:
              '0 0 0 18px rgba(245,200,90,0.10), 0 0 0 44px rgba(245,200,90,0.05), 0 26px 50px -18px rgba(160,130,40,0.26)',
          }}
        >
          <div className="absolute left-5 top-7 h-[19px] w-[19px] rounded-full bg-[rgba(180,160,110,0.16)]" />
          <div className="absolute left-[54px] top-[58px] h-3 w-3 rounded-full bg-[rgba(180,160,110,0.14)]" />
          <div className="absolute left-[62px] top-5 h-[9px] w-[9px] rounded-full bg-[rgba(180,160,110,0.12)]" />
        </div>
      </div>

      {/* estrellas — solo visibles de noche */}
      {STARS.map((s) => (
        <div
          key={`${s.left}-${s.top}`}
          className="absolute opacity-0 transition-opacity duration-500 dark:opacity-100"
          style={{ left: s.left, top: s.top }}
        >
          <div
            className="rounded-full"
            style={{ width: s.size, height: s.size, background: s.color, opacity: s.opacity }}
          />
        </div>
      ))}

      {/* nubes */}
      <Cloud className="absolute -left-[60px] top-[150px] animate-driftA" width={360} />
      <Cloud className="absolute -right-[40px] top-[400px] animate-driftB opacity-90" width={280} />
      <Cloud className="absolute bottom-[60px] left-[12%] animate-driftC opacity-85" width={300} />
    </div>
  );
}
