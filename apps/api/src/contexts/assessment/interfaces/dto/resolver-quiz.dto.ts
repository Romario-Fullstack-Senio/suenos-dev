import { IsString, IsArray, IsNotEmpty, IsOptional, ValidateBy, ValidationOptions, buildMessage } from 'class-validator';

/** `respuestas` es un number[][] (una entrada por pregunta, con los índices
 * marcados). class-validator con `{ each: true }` solo baja UN nivel, así que
 * no alcanza para validar los enteros del array interno — sin esta
 * comprobación, un payload tipo `[{...}]` llegaba entero hasta
 * Pregunta.verificar(), que hace `new Set(seleccionadas)` y explotaba con
 * "object is not iterable": 500 + alerta de Sentry, cuando debería ser un
 * 400 pidiendo el formato correcto. */
function EsMatrizDeEnteros(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'esMatrizDeEnteros',
      validator: {
        validate: (value: unknown) =>
          Array.isArray(value) &&
          value.every((fila) => Array.isArray(fila) && fila.every((i) => Number.isInteger(i) && i >= 0)),
        defaultMessage: buildMessage(
          (prefijo) => `${prefijo}$property debe ser un array de arrays de índices enteros no negativos`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

export class ResolverQuizDto {
  @IsString()
  @IsNotEmpty()
  quizId!: string;

  // Se IGNORA: el estudiante se toma del JWT (ver QuizController.resolver).
  // Se mantiene como campo opcional solo para no romper con 400 a los
  // clientes que todavía lo mandan — ValidationPipe corre con
  // forbidNonWhitelisted: true, así que una propiedad no declarada es un 400.
  @IsOptional()
  @IsString()
  estudianteId?: string;

  @IsArray()
  @EsMatrizDeEnteros()
  respuestas!: number[][];
}
