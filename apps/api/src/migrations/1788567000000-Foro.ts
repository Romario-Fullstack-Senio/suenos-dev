import { MigrationInterface, QueryRunner } from "typeorm";

export class Foro1788567000000 implements MigrationInterface {
    name = 'Foro1788567000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "foro_temas" (
                "id" uuid NOT NULL,
                "autor_id" character varying NOT NULL,
                "autor_nombre" character varying NOT NULL,
                "titulo" character varying NOT NULL,
                "texto" text NOT NULL,
                "categoria" character varying NOT NULL DEFAULT 'general',
                "fijado" boolean NOT NULL DEFAULT false,
                "cerrado" boolean NOT NULL DEFAULT false,
                "reportado_por" text,
                "oculta" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_foro_temas" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_foro_temas_autor_id" ON "foro_temas" ("autor_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_foro_temas_categoria" ON "foro_temas" ("categoria")`);

        await queryRunner.query(`
            CREATE TABLE "foro_respuestas" (
                "id" uuid NOT NULL,
                "tema_id" uuid NOT NULL,
                "autor_id" character varying NOT NULL,
                "autor_nombre" character varying NOT NULL,
                "autor_es_admin" boolean NOT NULL DEFAULT false,
                "texto" text NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_foro_respuestas" PRIMARY KEY ("id"),
                CONSTRAINT "FK_foro_respuestas_tema" FOREIGN KEY ("tema_id") REFERENCES "foro_temas"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_foro_respuestas_tema_id" ON "foro_respuestas" ("tema_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "foro_respuestas"`);
        await queryRunner.query(`DROP TABLE "foro_temas"`);
    }

}
