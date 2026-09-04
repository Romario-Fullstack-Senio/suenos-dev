import { MigrationInterface, QueryRunner } from "typeorm";

export class PreferenciaNotificaciones1788562000000 implements MigrationInterface {
    name = 'PreferenciaNotificaciones1788562000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "notificar_curso_nuevo" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "notificar_curso_nuevo"`);
    }

}
