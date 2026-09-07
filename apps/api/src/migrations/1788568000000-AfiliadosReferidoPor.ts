import { MigrationInterface, QueryRunner } from "typeorm";

export class AfiliadosReferidoPor1788568000000 implements MigrationInterface {
    name = 'AfiliadosReferidoPor1788568000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "referido_por" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "referido_por"`);
    }

}
