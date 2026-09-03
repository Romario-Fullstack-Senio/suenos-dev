import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative z-[1] border-t border-ink/[0.07] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-soft">
        <p>© {new Date().getFullYear()} Sueños Dev</p>
        <div className="flex gap-6">
          <Link href="/terminos" className="hover:text-ink transition-colors">Términos y Condiciones</Link>
          <Link href="/privacidad" className="hover:text-ink transition-colors">Privacidad</Link>
        </div>
      </div>
    </footer>
  );
}
