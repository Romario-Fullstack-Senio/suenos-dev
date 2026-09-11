import { Inject, Injectable } from '@nestjs/common';
import {
  PERFIL_GAMIFICACION_REPOSITORY,
  PerfilGamificacionRepository,
} from '../domain/perfil-gamificacion.repository.port';
import { CATALOGO_INSIGNIAS } from '../domain/insignias.catalog';

export interface PerfilGamificacionDto {
  puntos: number;
  leccionesCompletadas: number;
  cursosComprados: number;
  quizzesAprobados: number;
  rachaActual: number;
  rachaMaxima: number;
  insignias: {
    id: string;
    nombre: string;
    descripcion: string;
    icono: string;
    obtenida: boolean;
  }[];
}

@Injectable()
export class ObtenerPerfilGamificacionUseCase {
  constructor(
    @Inject(PERFIL_GAMIFICACION_REPOSITORY)
    private readonly perfilRepo: PerfilGamificacionRepository,
  ) {}

  async execute(usuarioId: string): Promise<PerfilGamificacionDto> {
    const perfil = await this.perfilRepo.findByUsuarioId(usuarioId);

    // Un usuario sin ninguna actividad todavía no tiene fila propia — se
    // devuelve el estado "en cero" en vez de un 404, para que el
    // frontend pueda mostrar el catálogo completo (todo bloqueado) desde
    // el primer momento.
    const insignias = CATALOGO_INSIGNIAS.map((def) => ({
      id: def.id,
      nombre: def.nombre,
      descripcion: def.descripcion,
      icono: def.icono,
      obtenida: perfil?.insigniasObtenidas.includes(def.id) ?? false,
    }));

    return {
      puntos: perfil?.puntos ?? 0,
      leccionesCompletadas: perfil?.leccionesCompletadas ?? 0,
      cursosComprados: perfil?.cursosComprados ?? 0,
      quizzesAprobados: perfil?.quizzesAprobados ?? 0,
      rachaActual: perfil?.rachaActual ?? 0,
      rachaMaxima: perfil?.rachaMaxima ?? 0,
      insignias,
    };
  }
}
