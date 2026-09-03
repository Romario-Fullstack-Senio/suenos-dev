import { MigrationInterface, QueryRunner } from "typeorm";

export class CourseObjetivosAndCatalogUpgrades1788469130944 implements MigrationInterface {
    name = 'CourseObjetivosAndCatalogUpgrades1788469130944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cursos" ADD "objetivos" text`);
        await queryRunner.query(`ALTER TABLE "cursos" ADD "requisitos" text`);
        await queryRunner.query(`ALTER TABLE "cursos" ADD "audiencia" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cursos" DROP COLUMN "audiencia"`);
        await queryRunner.query(`ALTER TABLE "cursos" DROP COLUMN "requisitos"`);
        await queryRunner.query(`ALTER TABLE "cursos" DROP COLUMN "objetivos"`);
    }

}
