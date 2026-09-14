# Cambios — segunda ronda

Descomprimir sobre la raíz del repo. Las rutas ya coinciden con `apps/web/...`.

Después: `pnpm --filter web build` y pasame cualquier error.

## Archivos nuevos (7)

| Archivo | Qué es |
| --- | --- |
| `src/components/ui/EstadoVacio.tsx` | Estado vacío único (icono, título, texto, CTA) |
| `src/components/ui/SkeletonGrid.tsx` | `SkeletonGrid` / `SkeletonList` / `SkeletonTable` |
| `src/components/ui/Badge.tsx` | `Badge tono=...` y `EstadoCursoBadge` |
| `src/app/error.tsx` | Error boundary de ruta, dentro del layout |
| `src/app/not-found.tsx` | 404 propio |
| `src/app/loading.tsx` | Fallback de navegación |
| `src/app/opengraph-image.tsx` | Imagen OG generada con `next/og` |

## Sistema

- **globals.css**: fuera el `@import` de Google Fonts (bloqueaba el render). Entran
  `--color-success` / `--color-warning` / `--color-danger`, con valor propio en
  `:root` y en `.dark`.
- **tailwind.config.ts**: colores `success` / `warning` / `danger`. Se borró el
  namespace `suenos.*` y las familias `font-display` (Space Grotesk) y `font-body`
  (Inter), que estaban declaradas y nunca se importaban.
- **layout.tsx**: Manrope y JetBrains Mono vía `next/font/google`, autohospedadas.

## Header

Tres links de producto en la barra (Cursos, Paquetes, Comunidad) más carrito,
notificaciones y un menú desplegable del avatar. Todo lo personal (Mis Cursos,
Favoritos, Certificados, Logros, panel de instructor, administración, perfil,
soporte, tema, salir) vive ahí dentro, con el nombre y el email arriba. Cierra con
click afuera y con Escape. De 14 elementos en una fila a 6.

## Barrido de consistencia

- **Precios**: `formatearPrecio` en carrito, checkout, favoritos, relacionados,
  paquetes (lista y detalle), compras, instructor y admin. No queda ningún
  `${precio} USD` crudo.
- **Fechas**: `formatearFecha` en certificados y compras.
- **Estados de carga**: los 24 `Cargando...` reemplazados por skeletons. El único
  que queda es el de `Button` con `isLoading`, que es una etiqueta de botón.
- **Estados vacíos**: `EstadoVacio` en carrito, favoritos, certificados, compras,
  paquetes, checkout e instructor.
- **Contraste**: `text-green-400` sobre `bg-green-500/15` eliminado de admin/cursos,
  instructor e instructor/cursos. Los estados de orden dejan de usar `bg-*-100` /
  `text-*-700` fijos, que en tema oscuro quedaban como parches claros.
- **Favoritos y relacionados**: misma corrección de la tarjeta que en el catálogo
  (el botón de favoritos ya no va dentro del enlace).

## Pendiente

El 2N+1 del dashboard: necesita un endpoint nuevo en el API que devuelva las
inscripciones con curso y progreso embebidos.

## Sin subir

No se tocó git: sin commits, sin push, sin PR.
