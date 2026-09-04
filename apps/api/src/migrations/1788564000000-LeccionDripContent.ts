import { MigrationInterface, QueryRunner } from "typeorm";

export class LeccionDripContent1788564000000 implements MigrationInterface {
    name = 'LeccionDripContent1788564000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lecciones" ADD "dias_desde_inscripcion" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lecciones" DROP COLUMN "dias_desde_inscripcion"`);
    }

}
