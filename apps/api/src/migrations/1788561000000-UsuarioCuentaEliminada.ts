import { MigrationInterface, QueryRunner } from "typeorm";

export class UsuarioCuentaEliminada1788561000000 implements MigrationInterface {
    name = 'UsuarioCuentaEliminada1788561000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "cuenta_eliminada" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "cuenta_eliminada"`);
    }

}
