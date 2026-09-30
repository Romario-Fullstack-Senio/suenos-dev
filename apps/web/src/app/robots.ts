import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /auth/* NO va acá a propósito: esas páginas llevan noindex (ver
      // app/auth/layout.tsx), y si robots bloquea el rastreo Google nunca
      // llega a leer ese noindex — puede indexar la URL igual por los links.
      disallow: ['/dashboard', '/admin', '/instructor', '/perfil', '/checkout', '/carrito', '/aprender', '/favoritos', '/soporte', '/logros'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
