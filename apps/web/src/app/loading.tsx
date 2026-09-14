import { SkeletonGrid } from '@/components/ui/SkeletonGrid';

/**
 * Fallback de navegación por defecto. Sin este archivo, cambiar de ruta no
 * daba ningún feedback hasta que el server component terminaba: la pantalla
 * anterior quedaba congelada y parecía que el click no había funcionado.
 * Las rutas con una espera muy distinta pueden declarar su propio
 * loading.tsx y este queda como red de seguridad.
 */
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="h-8 w-56 bg-ink/[0.06] rounded mb-8 animate-pulse" />
      <SkeletonGrid cantidad={3} />
    </div>
  );
}
