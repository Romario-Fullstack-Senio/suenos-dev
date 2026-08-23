import { Usuario } from './usuario.entity';

export const USUARIO_REPOSITORY = 'USUARIO_REPOSITORY';

export interface UsuarioRepository {
  save(usuario: Usuario): Promise<void>;
  findByEmail(email: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
}
