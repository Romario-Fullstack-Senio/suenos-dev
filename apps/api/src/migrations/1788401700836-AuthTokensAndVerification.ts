import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthTokensAndVerification1788401700836 implements MigrationInterface {
    name = 'AuthTokensAndVerification1788401700836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL, "usuario_id" character varying NOT NULL, "token_hash" character varying NOT NULL, "expira" TIMESTAMP NOT NULL, "revocado" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c8349fdadc1bc791125bdd8c85" ON "refresh_tokens" ("usuario_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a7838d2ba25be1342091b6695f" ON "refresh_tokens" ("token_hash") `);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "email_verificado" boolean NOT NULL DEFAULT false`);
        // Backfill: las cuentas que ya existían antes de este flujo de
        // verificación no deben quedar bloqueadas/marcadas como
        // "no verificadas" de la nada — solo los registros NUEVOS a partir
        // de acá arrancan en false y deben confirmar el email.
        await queryRunner.query(`UPDATE "usuarios" SET "email_verificado" = true`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "verificacion_token" character varying`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "verificacion_token_expira" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "reset_password_token" character varying`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "reset_password_expira" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "reset_password_expira"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "reset_password_token"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "verificacion_token_expira"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "verificacion_token"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "email_verificado"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7838d2ba25be1342091b6695f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c8349fdadc1bc791125bdd8c85"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
