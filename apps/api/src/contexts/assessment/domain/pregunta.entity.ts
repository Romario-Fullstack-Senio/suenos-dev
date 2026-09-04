import { DomainError } from '@suenos-dev/shared-kernel';

export const TIPOS_PREGUNTA = ['opcion_unica', 'verdadero_falso', 'seleccion_multiple'] as const;
export type TipoPregunta = (typeof TIPOS_PREGUNTA)[number];

export class Pregunta {
  private constructor(
    private readonly _id: string,
    private readonly _enunciado: string,
    private readonly _opciones: string[],
    private readonly _tipo: TipoPregunta,
    private readonly _respuestasCorrectas: number[],
  ) {}

  static crear(
    id: string,
    enunciado: string,
    opciones: string[],
    tipo: TipoPregunta,
    respuestasCorrectas: number[],
  ): Pregunta {
    if (opciones.length < 2) {
      throw new DomainError('Una pregunta necesita al menos 2 opciones');
    }
    if (respuestasCorrectas.length === 0) {
      throw new DomainError('Debe indicarse al menos una respuesta correcta');
    }
    for (const indice of respuestasCorrectas) {
      if (indice < 0 || indice >= opciones.length) {
        throw new DomainError('La respuesta correcta debe ser un índice válido dentro de las opciones');
      }
    }
    if (new Set(respuestasCorrectas).size !== respuestasCorrectas.length) {
      throw new DomainError('Las respuestas correctas no pueden repetirse');
    }
    if (tipo === 'verdadero_falso' && opciones.length !== 2) {
      throw new DomainError('Una pregunta de verdadero/falso debe tener exactamente 2 opciones');
    }
    if ((tipo === 'opcion_unica' || tipo === 'verdadero_falso') && respuestasCorrectas.length !== 1) {
      throw new DomainError('Este tipo de pregunta tiene una única respuesta correcta');
    }

    return new Pregunta(id, enunciado, opciones, tipo, respuestasCorrectas);
  }

  get id(): string {
    return this._id;
  }

  get enunciado(): string {
    return this._enunciado;
  }

  get opciones(): string[] {
    return this._opciones;
  }

  get tipo(): TipoPregunta {
    return this._tipo;
  }

  get respuestasCorrectas(): number[] {
    return this._respuestasCorrectas;
  }

  /** Compara por conjunto, sin importar el orden en que se marcaron las
   * opciones — así opción única, verdadero/falso y selección múltiple usan
   * exactamente la misma lógica de corrección (para opción única/V-F,
   * `seleccionadas` trae un solo elemento y el set-compare se reduce a
   * comparar ese único índice). */
  verificar(seleccionadas: number[]): boolean {
    const a = [...new Set(seleccionadas)].sort((x, y) => x - y);
    const b = [...this._respuestasCorrectas].sort((x, y) => x - y);
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
}
