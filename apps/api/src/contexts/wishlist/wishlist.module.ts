import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritoOrmEntity } from './infrastructure/typeorm/favorito.orm-entity';
import { FavoritoTypeOrmRepository } from './infrastructure/typeorm/favorito.typeorm-repository';
import { FAVORITO_REPOSITORY } from './domain/favorito.repository.port';
import { FavoritoController } from './interfaces/favorito.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [TypeOrmModule.forFeature([FavoritoOrmEntity]), IdentityModule],
  controllers: [FavoritoController],
  providers: [{ provide: FAVORITO_REPOSITORY, useClass: FavoritoTypeOrmRepository }],
  exports: [FAVORITO_REPOSITORY],
})
export class WishlistModule {}
