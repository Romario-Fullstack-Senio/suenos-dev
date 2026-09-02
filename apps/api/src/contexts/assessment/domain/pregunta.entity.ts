import { DomainError } from '@suenos-dev/shared-kernel';

export class Pregunta {
  private constructor(
    private readonly _id: string,
    private readonly _enunciado: string,
    private readonly _opciones: string[],
    private readonly _respuestaCorrecta: number,
  ) {}

  static crear(id: string, enunciado: string, opciones: string[], respuestaCorrecta: number): Pregunta {
    if (respuestaCorrecta < 0 || respuestaCorrecta >= opciones.length) {
      throw new DomainError('La respuesta correcta debe ser un índice válido dentro de las opciones');
    }
    return new Pregunta(id, enunciado, opciones, respuestaCorrecta);
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

  get respuestaCorrecta(): number {
    return this._respuestaCorrecta;
  }

  verificar(respuestaSeleccionada: number): boolean {
    return respuestaSeleccionada === this._respuestaCorrecta;
  }
}
