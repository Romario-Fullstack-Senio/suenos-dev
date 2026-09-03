import { MigrationInterface, QueryRunner } from "typeorm";

export class ReviewsPreviewAndRefunds1788466931418 implements MigrationInterface {
    name = 'ReviewsPreviewAndRefunds1788466931418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "resenas" ("id" uuid NOT NULL, "curso_id" character varying NOT NULL, "estudiante_id" character varying NOT NULL, "estudiante_nombre" character varying NOT NULL, "calificacion" integer NOT NULL, "comentario" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8f2c05f4f9be4dfe60ef900d000" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dcb7455d236305637fc47f00e2" ON "resenas" ("curso_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_28e9323731155c637383da7ce5" ON "resenas" ("estudiante_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2bddbd610e02071896136cadc0" ON "resenas" ("curso_id", "estudiante_id") `);
        await queryRunner.query(`ALTER TABLE "lecciones" ADD "es_vista_previa" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lecciones" DROP COLUMN "es_vista_previa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2bddbd610e02071896136cadc0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_28e9323731155c637383da7ce5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dcb7455d236305637fc47f00e2"`);
        await queryRunner.query(`DROP TABLE "resenas"`);
    }

}
