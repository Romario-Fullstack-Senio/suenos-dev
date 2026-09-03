import { IsString, IsNumber, MinLength, IsPositive, IsOptional, IsUrl, IsBoolean, IsUUID } from 'class-validator';

export class AgregarLeccionDto {
  // Opcional: si el video ya se subió a POST /videos/upload antes de crear
  // la lección (flujo actual del frontend), ese mismo id es el que hay que
  // usar acá — el video quedó guardado en MinIO bajo esa key, y el control
  // de acceso a video (VerificarAccesoVideoUseCase) resuelve la lección
  // buscando por su id real, no por uno inventado en el momento del upload.
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(2)
  titulo!: string;

  @IsNumber()
  @IsPositive()
  orden!: number;

  @IsNumber()
  @IsPositive()
  duracionSegundos!: number;

  @IsOptional()
  @IsUrl({ require_tld: false }) // require_tld: false para permitir http://localhost:...
  videoUrl?: string;

  @IsOptional()
  @IsBoolean()
  esVistaPrevia?: boolean;
}
