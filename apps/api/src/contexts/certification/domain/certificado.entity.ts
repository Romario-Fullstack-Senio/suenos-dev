import { AggregateRoot } from '@suenos-dev/shared-kernel';
import { randomUUID } from 'crypto';

export interface CertificadoProps {
  estudianteId: string;
  cursoId: string;
  estudianteNombre: string;
  cursoNombre: string;
  fechaEmision: Date;
  codigoVerificacion: string;
}

export class Certificado extends AggregateRoot<string> {
  private props: CertificadoProps;

  private constructor(id: string, props: CertificadoProps) {
    super(id);
    this.props = props;
  }

  static emitir(
    id: string,
    estudianteId: string,
    cursoId: string,
    estudianteNombre: string,
    cursoNombre: string,
  ): Certificado {
    const certificado = new Certificado(id, {
      estudianteId,
      cursoId,
      estudianteNombre,
      cursoNombre,
      fechaEmision: new Date(),
      codigoVerificacion: randomUUID(),
    });
    return certificado;
  }

  get estudianteId(): string {
    return this.props.estudianteId;
  }

  get cursoId(): string {
    return this.props.cursoId;
  }

  get estudianteNombre(): string {
    return this.props.estudianteNombre;
  }

  get cursoNombre(): string {
    return this.props.cursoNombre;
  }

  get fechaEmision(): Date {
    return this.props.fechaEmision;
  }

  get codigoVerificacion(): string {
    return this.props.codigoVerificacion;
  }

  getVerifyUrl(): string {
    // Default alineado con .env.example (API_URL=http://localhost:3001) —
    // el puerto de la propia API, no el del front (3000). Con el default
    // viejo, sin API_URL seteada, este link (y el QR del PDF) apuntaban al
    // servidor de Next.js, que no tiene esta ruta, y daban 404.
    const API_URL = process.env.API_URL || 'http://localhost:3001';
    return `${API_URL}/api/certificados/${this.id}/verificar`;
  }
}
