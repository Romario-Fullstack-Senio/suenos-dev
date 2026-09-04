import { MigrationInterface, QueryRunner } from "typeorm";

export class TwoFactorAuth1788543615643 implements MigrationInterface {
    name = 'TwoFactorAuth1788543615643'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "two_factor_secret" character varying`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "two_factor_enabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "two_factor_backup_codes" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "two_factor_backup_codes"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "two_factor_enabled"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "two_factor_secret"`);
    }

}
