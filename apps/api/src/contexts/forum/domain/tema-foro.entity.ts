import { AggregateRoot, DomainError, UnauthorizedDomainError } from '@suenos-dev/shared-kernel';
import { RespuestaForo } from './respuesta-foro.entity';

export type CategoriaForo = 'general' | 'ayuda' | 'proyectos' | 'anuncios' | 'sugerencias';
const CATEGORIAS: CategoriaForo[] = ['general', 'ayuda', 'proyectos', 'anuncios', 'sugerencias'];

// Mismo umbral y misma lógica de reportes que Resena/Pregunta — ver el
// comentario en resena.entity.ts.
const UMBRAL_OCULTAR_POR_REPORTES = 3;

interface TemaForoProps {
  autorId: string;
  autorNombre: string;
  titulo: string;
  texto: string;
  categoria: CategoriaForo;
  fijado: boolean;
  cerrado: boolean;
  respuestas: RespuestaForo[];
  createdAt: Date;
  reportadoPor: string[];
  oculta: boolean;
}

export class TemaForo extends AggregateRoot<string> {
  private props: TemaForoProps;

  private constructor(id: string, props: TemaForoProps) {
    super(id);
    this.props = props;
  }

  static crear(
    id: string,
    params: { autorId: string; autorNombre: string; titulo: string; texto: string; categoria: string },
  ): TemaForo {
    const titulo = params.titulo?.trim();
    const texto = params.texto?.trim();
    if (!titulo) throw new DomainError('El título no puede estar vacío');
    if (titulo.length > 200) throw new DomainError('El título es demasiado largo (máx. 200 caracteres)');
    if (!texto) throw new DomainError('El mensaje no puede estar vacío');
    if (texto.length > 5000) throw new DomainError('El mensaje es demasiado largo (máx. 5000 caracteres)');
    if (!CATEGORIAS.includes(params.categoria as CategoriaForo)) {
      throw new DomainError('Categoría de tema inválida');
    }
    return new TemaForo(id, {
      autorId: params.autorId,
      autorNombre: params.autorNombre,
      titulo,
      texto,
      categoria: params.categoria as CategoriaForo,
      fijado: false,
      cerrado: false,
      respuestas: [],
      createdAt: new Date(),
      reportadoPor: [],
      oculta: false,
    });
  }

  static reconstitute(id: string, props: TemaForoProps): TemaForo {
    return new TemaForo(id, { ...props, respuestas: [...props.respuestas], reportadoPor: [...props.reportadoPor] });
  }

  get autorId(): string { return this.props.autorId; }
  get autorNombre(): string { return this.props.autorNombre; }
  get titulo(): string { return this.props.titulo; }
  get texto(): string { return this.props.texto; }
  get categoria(): CategoriaForo { return this.props.categoria; }
  get fijado(): boolean { return this.props.fijado; }
  get cerrado(): boolean { return this.props.cerrado; }
  get respuestas(): RespuestaForo[] { return this.props.respuestas; }
  get createdAt(): Date { return this.props.createdAt; }
  get reportadoPor(): string[] { return this.props.reportadoPor; }
  get totalReportes(): number { return this.props.reportadoPor.length; }
  get oculta(): boolean { return this.props.oculta; }

  agregarRespuesta(respuesta: RespuestaForo): void {
    if (this.props.cerrado && !respuesta.autorEsAdmin) {
      throw new DomainError('Este tema está cerrado — ya no admite respuestas nuevas');
    }
    this.props.respuestas.push(respuesta);
    this.touch();
  }

  fijar(valor: boolean): void {
    this.props.fijado = valor;
    this.touch();
  }

  cerrar(valor: boolean): void {
    this.props.cerrado = valor;
    this.touch();
  }

  /** Igual criterio que Resena#reportar / Pregunta#reportar. */
  reportar(usuarioId: string): void {
    if (this.props.autorId === usuarioId) {
      throw new DomainError('No podés reportar tu propio tema');
    }
    if (this.props.reportadoPor.includes(usuarioId)) {
      throw new DomainError('Ya reportaste este tema');
    }
    this.props.reportadoPor = [...this.props.reportadoPor, usuarioId];
    if (this.props.reportadoPor.length >= UMBRAL_OCULTAR_POR_REPORTES) {
      this.props.oculta = true;
    }
    this.touch();
  }

  restaurar(): void {
    this.props.oculta = false;
    this.props.reportadoPor = [];
    this.touch();
  }

  verificarPuedeEliminar(callerId: string, callerEsAdmin: boolean): void {
    if (!callerEsAdmin && callerId !== this.props.autorId) {
      throw new UnauthorizedDomainError('No tenés permiso para eliminar este tema');
    }
  }
}
