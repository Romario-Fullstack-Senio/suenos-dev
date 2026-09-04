import { MigrationInterface, QueryRunner } from "typeorm";

export class LessonResources1788545560631 implements MigrationInterface {
    name = 'LessonResources1788545560631'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lecciones" ADD "recursos" text NOT NULL DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lecciones" DROP COLUMN "recursos"`);
    }

}
