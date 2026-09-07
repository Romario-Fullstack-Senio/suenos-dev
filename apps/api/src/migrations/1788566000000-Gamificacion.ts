import { MigrationInterface, QueryRunner } from "typeorm";

export class Gamificacion1788566000000 implements MigrationInterface {
    name = 'Gamificacion1788566000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "perfiles_gamificacion" (
                "id" uuid NOT NULL,
                "usuario_id" character varying NOT NULL,
                "puntos" integer NOT NULL DEFAULT 0,
                "lecciones_completadas" integer NOT NULL DEFAULT 0,
                "cursos_comprados" integer NOT NULL DEFAULT 0,
                "quizzes_aprobados" integer NOT NULL DEFAULT 0,
                "racha_actual" integer NOT NULL DEFAULT 0,
                "racha_maxima" integer NOT NULL DEFAULT 0,
                "ultima_actividad_fecha" TIMESTAMP,
                "insignias_obtenidas" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_perfiles_gamificacion" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_perfiles_gamificacion_usuario_id" ON "perfiles_gamificacion" ("usuario_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "perfiles_gamificacion"`);
    }

}
