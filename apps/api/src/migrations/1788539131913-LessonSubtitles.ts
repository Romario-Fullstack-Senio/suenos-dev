import { MigrationInterface, QueryRunner } from "typeorm";

export class LessonSubtitles1788539131913 implements MigrationInterface {
    name = 'LessonSubtitles1788539131913'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lecciones" ADD "subtitulos_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lecciones" DROP COLUMN "subtitulos_url"`);
    }

}
