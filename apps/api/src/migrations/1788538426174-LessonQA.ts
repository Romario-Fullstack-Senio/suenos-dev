import { MigrationInterface, QueryRunner } from "typeorm";

export class LessonQA1788538426174 implements MigrationInterface {
    name = 'LessonQA1788538426174'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "leccion_preguntas" ("id" uuid NOT NULL, "curso_id" character varying NOT NULL, "leccion_id" character varying NOT NULL, "autor_id" character varying NOT NULL, "autor_nombre" character varying NOT NULL, "autor_es_instructor" boolean NOT NULL DEFAULT false, "texto" text NOT NULL, "resuelta" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_047fff11f8122d390b2310240eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0b6a1d2e78e34f02da729ab22d" ON "leccion_preguntas" ("curso_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8fa9821ceb6d0eb0576e1c2419" ON "leccion_preguntas" ("leccion_id") `);
        await queryRunner.query(`CREATE TABLE "leccion_pregunta_respuestas" ("id" uuid NOT NULL, "pregunta_id" uuid NOT NULL, "autor_id" character varying NOT NULL, "autor_nombre" character varying NOT NULL, "autor_es_instructor" boolean NOT NULL DEFAULT false, "texto" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3ca58dc7d45d0fdc87f32a67ad2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e3a189e77ab80cd45e4114c16e" ON "leccion_pregunta_respuestas" ("pregunta_id") `);
        await queryRunner.query(`ALTER TABLE "leccion_pregunta_respuestas" ADD CONSTRAINT "FK_e3a189e77ab80cd45e4114c16e2" FOREIGN KEY ("pregunta_id") REFERENCES "leccion_preguntas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leccion_pregunta_respuestas" DROP CONSTRAINT "FK_e3a189e77ab80cd45e4114c16e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e3a189e77ab80cd45e4114c16e"`);
        await queryRunner.query(`DROP TABLE "leccion_pregunta_respuestas"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8fa9821ceb6d0eb0576e1c2419"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b6a1d2e78e34f02da729ab22d"`);
        await queryRunner.query(`DROP TABLE "leccion_preguntas"`);
    }

}
