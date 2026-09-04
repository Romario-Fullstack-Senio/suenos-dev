import { MigrationInterface, QueryRunner } from "typeorm";

export class RefreshTokenSessions1788546121112 implements MigrationInterface {
    name = 'RefreshTokenSessions1788546121112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "family_id" uuid`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "user_agent" character varying`);
        // Backfill: las filas de antes de familyId no tienen forma de saber
        // qué rotaciones pertenecían a la misma sesión de login — cada una
        // pasa a ser su propia "sesión" (mismo criterio que el fallback en
        // RefreshTokenTypeOrmRepository.toDomain).
        await queryRunner.query(`UPDATE "refresh_tokens" SET "family_id" = "id" WHERE "family_id" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_d5e27da0cd39bc3bb2811fc8ba" ON "refresh_tokens" ("family_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_d5e27da0cd39bc3bb2811fc8ba"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "user_agent"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "family_id"`);
    }

}
