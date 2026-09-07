import { AggregateRoot } from '@suenos-dev/shared-kernel';
import { InsigniaId } from './insignias.catalog';

const PUNTOS_LECCION_COMPLETADA = 10;
const PUNTOS_CURSO_COMPRADO = 20;
const PUNTOS_QUIZ_APROBADO = 50;

export interface PerfilGamificacionProps {
  usuarioId: string;
  puntos: number;
  leccionesCompletadas: number;
  cursosComprados: number;
  quizzesAprobados: number;
  rachaActual: number;
  rachaMaxima: number;
  ultimaActividadFecha: Date | null;
  insigniasObtenidas: InsigniaId[];
}

function truncarADia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function diasEntre(a: Date, b: Date): number {
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  return Math.round((truncarADia(b).getTime() - truncarADia(a).getTime()) / MS_POR_DIA);
}

/** Perfil de gamificación de UN estudiante — puntos, contadores para las
 * insignias por hito, y la racha de días consecutivos con actividad.
 * Un aggregate por usuario (no uno por acción, como Resena/Pregunta):
 * acá lo que importa es el estado acumulado, no el historial de eventos
 * individuales. */
export class PerfilGamificacion extends AggregateRoot<string> {
  private props: PerfilGamificacionProps;

  private constructor(id: string, props: PerfilGamificacionProps) {
    super(id);
    this.props = props;
  }

  static crear(id: string, usuarioId: string): PerfilGamificacion {
    return new PerfilGamificacion(id, {
      usuarioId,
      puntos: 0,
      leccionesCompletadas: 0,
      cursosComprados: 0,
      quizzesAprobados: 0,
      rachaActual: 0,
      rachaMaxima: 0,
      ultimaActividadFecha: null,
      insigniasObtenidas: [],
    });
  }

  static reconstitute(id: string, props: PerfilGamificacionProps): PerfilGamificacion {
    return new PerfilGamificacion(id, { ...props, insigniasObtenidas: [...props.insigniasObtenidas] });
  }

  get usuarioId(): string { return this.props.usuarioId; }
  get puntos(): number { return this.props.puntos; }
  get leccionesCompletadas(): number { return this.props.leccionesCompletadas; }
  get cursosComprados(): number { return this.props.cursosComprados; }
  get quizzesAprobados(): number { return this.props.quizzesAprobados; }
  get rachaActual(): number { return this.props.rachaActual; }
  get rachaMaxima(): number { return this.props.rachaMaxima; }
  get ultimaActividadFecha(): Date | null { return this.props.ultimaActividadFecha; }
  get insigniasObtenidas(): InsigniaId[] { return this.props.insigniasObtenidas; }

  registrarLeccionCompletada(): InsigniaId[] {
    this.props.leccionesCompletadas += 1;
    this.props.puntos += PUNTOS_LECCION_COMPLETADA;
    return this.registrarActividadYEvaluar();
  }

  registrarCursoComprado(): InsigniaId[] {
    this.props.cursosComprados += 1;
    this.props.puntos += PUNTOS_CURSO_COMPRADO;
    return this.registrarActividadYEvaluar();
  }

  registrarQuizAprobado(): InsigniaId[] {
    this.props.quizzesAprobados += 1;
    this.props.puntos += PUNTOS_QUIZ_APROBADO;
    return this.registrarActividadYEvaluar();
  }

  /** Actualiza la racha de días consecutivos con actividad y evalúa qué
   * insignias nuevas se ganaron — se llama después de cada acción que
   * suma puntos, nunca sola, para que racha e insignias siempre reflejen
   * el estado post-acción. */
  private registrarActividadYEvaluar(): InsigniaId[] {
    this.actualizarRacha();
    this.touch();
    return this.evaluarInsigniasNuevas();
  }

  private actualizarRacha(): void {
    const hoy = truncarADia(new Date());
    if (!this.props.ultimaActividadFecha) {
      this.props.rachaActual = 1;
    } else {
      const dias = diasEntre(this.props.ultimaActividadFecha, hoy);
      if (dias === 0) {
        // Ya hubo actividad hoy — la racha no cambia (ni suma ni corta).
      } else if (dias === 1) {
        this.props.rachaActual += 1;
      } else {
        // Se saltó al menos un día — la racha se corta y arranca de nuevo.
        this.props.rachaActual = 1;
      }
    }
    this.props.ultimaActividadFecha = hoy;
    this.props.rachaMaxima = Math.max(this.props.rachaMaxima, this.props.rachaActual);
  }

  /** Compara los contadores actuales contra el catálogo y devuelve las
   * insignias recién cruzadas (ya agregadas a insigniasObtenidas) — no
   * las que ya tenía de antes, para que quien llame pueda, por ejemplo,
   * notificar solo las nuevas. */
  private evaluarInsigniasNuevas(): InsigniaId[] {
    const candidatas: [InsigniaId, boolean][] = [
      ['primera_leccion', this.props.leccionesCompletadas >= 1],
      ['diez_lecciones', this.props.leccionesCompletadas >= 10],
      ['primer_curso', this.props.cursosComprados >= 1],
      ['cinco_cursos', this.props.cursosComprados >= 5],
      ['primer_quiz_aprobado', this.props.quizzesAprobados >= 1],
      ['racha_7_dias', this.props.rachaMaxima >= 7],
      ['racha_30_dias', this.props.rachaMaxima >= 30],
      ['estudiante_dedicado', this.props.puntos >= 500],
    ];

    const nuevas: InsigniaId[] = [];
    for (const [id, cumple] of candidatas) {
      if (cumple && !this.props.insigniasObtenidas.includes(id)) {
        this.props.insigniasObtenidas.push(id);
        nuevas.push(id);
      }
    }
    return nuevas;
  }
}
