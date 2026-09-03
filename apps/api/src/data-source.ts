import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * DataSource standalone para el CLI de TypeORM (migration:generate/run/revert).
 * Nest usa `autoLoadEntities: true` en app.module.ts para el runtime — este
 * archivo existe solo porque el CLI no puede introspeccionar los módulos de
 * Nest, así que enumeramos las entidades por glob a mano. Si se agrega un
 * nuevo `*.orm-entity.ts`, se recoge automáticamente por el patrón de abajo,
 * no hace falta tocar este archivo.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'admin',
  database: process.env.DATABASE_NAME || 'suenos-dev',
  entities: [__dirname + '/**/*.orm-entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
