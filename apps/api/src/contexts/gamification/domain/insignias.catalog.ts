// Catálogo estático de insignias — no hay tabla propia para esto: son
// datos fijos del código (igual que, por ejemplo, las categorías de
// tickets de soporte), no algo que un admin vaya a crear/editar por
// ahora. Agregar una insignia nueva es agregar una entrada acá.
export type InsigniaId =
  | 'primera_leccion'
  | 'diez_lecciones'
  | 'primer_curso'
  | 'cinco_cursos'
  | 'primer_quiz_aprobado'
  | 'racha_7_dias'
  | 'racha_30_dias'
  | 'estudiante_dedicado';

export interface InsigniaDef {
  id: InsigniaId;
  nombre: string;
  descripcion: string;
  icono: string; // nombre de ícono de lucide-react, interpretado por el frontend
}

export const CATALOGO_INSIGNIAS: InsigniaDef[] = [
  { id: 'primera_leccion', nombre: 'Primeros pasos', descripcion: 'Completaste tu primera lección', icono: 'Footprints' },
  { id: 'diez_lecciones', nombre: 'En marcha', descripcion: 'Completaste 10 lecciones', icono: 'Rocket' },
  { id: 'primer_curso', nombre: 'Primera compra', descripcion: 'Compraste tu primer curso', icono: 'ShoppingBag' },
  { id: 'cinco_cursos', nombre: 'Coleccionista', descripcion: 'Compraste 5 cursos', icono: 'Library' },
  { id: 'primer_quiz_aprobado', nombre: 'Aprobado', descripcion: 'Aprobaste tu primer quiz', icono: 'CheckCircle2' },
  { id: 'racha_7_dias', nombre: 'Constancia', descripcion: 'Racha de 7 días seguidos con actividad', icono: 'Flame' },
  { id: 'racha_30_dias', nombre: 'Imparable', descripcion: 'Racha de 30 días seguidos con actividad', icono: 'Flame' },
  { id: 'estudiante_dedicado', nombre: 'Estudiante dedicado', descripcion: 'Llegaste a 500 puntos', icono: 'Trophy' },
];

export function obtenerInsigniaDef(id: InsigniaId): InsigniaDef {
  const def = CATALOGO_INSIGNIAS.find((i) => i.id === id);
  if (!def) throw new Error(`Insignia desconocida: ${id}`);
  return def;
}
