import { MigrationInterface, QueryRunner } from "typeorm";

export class ModeracionReportes1788565000000 implements MigrationInterface {
    name = 'ModeracionReportes1788565000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "resenas" ADD "reportado_por" text`);
        await queryRunner.query(`ALTER TABLE "resenas" ADD "oculta" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "leccion_preguntas" ADD "reportado_por" text`);
        await queryRunner.query(`ALTER TABLE "leccion_preguntas" ADD "oculta" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leccion_preguntas" DROP COLUMN "oculta"`);
        await queryRunner.query(`ALTER TABLE "leccion_preguntas" DROP COLUMN "reportado_por"`);
        await queryRunner.query(`ALTER TABLE "resenas" DROP COLUMN "oculta"`);
        await queryRunner.query(`ALTER TABLE "resenas" DROP COLUMN "reportado_por"`);
    }

}
