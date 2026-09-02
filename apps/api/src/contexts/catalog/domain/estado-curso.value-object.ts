import { ValueObject, DomainError } from '@suenos-dev/shared-kernel';

type Estado = 'borrador' | 'publicado' | 'archivado';

interface EstadoCursoProps {
  value: Estado;
}

export class EstadoCurso extends ValueObject<EstadoCursoProps> {
  private constructor(props: EstadoCursoProps) {
    super(props);
  }

  get value(): Estado {
    return this.props.value;
  }

  static borrador(): EstadoCurso {
    return new EstadoCurso({ value: 'borrador' });
  }

  static publicado(): EstadoCurso {
    return new EstadoCurso({ value: 'publicado' });
  }

  static archivado(): EstadoCurso {
    return new EstadoCurso({ value: 'archivado' });
  }

  static from(value: string): EstadoCurso {
    const valid: Estado[] = ['borrador', 'publicado', 'archivado'];
    if (!valid.includes(value as Estado)) {
      throw new DomainError(`Estado inválido: ${value}`);
    }
    return new EstadoCurso({ value: value as Estado });
  }
}
