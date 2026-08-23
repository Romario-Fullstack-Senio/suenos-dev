import { ValueObject } from '@suenos-dev/shared-kernel';

type RolTipo = 'estudiante' | 'instructor' | 'admin';

interface RolProps {
  value: RolTipo;
}

export class Rol extends ValueObject<RolProps> {
  private constructor(props: RolProps) {
    super(props);
  }

  get value(): RolTipo {
    return this.props.value;
  }

  static estudiante(): Rol {
    return new Rol({ value: 'estudiante' });
  }

  static instructor(): Rol {
    return new Rol({ value: 'instructor' });
  }

  static admin(): Rol {
    return new Rol({ value: 'admin' });
  }

  static from(value: string): Rol {
    const valid: RolTipo[] = ['estudiante', 'instructor', 'admin'];
    if (!valid.includes(value as RolTipo)) {
      throw new Error(`Rol inválido: ${value}`);
    }
    return new Rol({ value: value as RolTipo });
  }
}
