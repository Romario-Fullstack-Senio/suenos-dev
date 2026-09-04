import { MigrationInterface, QueryRunner } from "typeorm";

/** Agrega tipos de pregunta al quiz (verdadero/falso, selección múltiple)
 * sobre el modelo existente de opción única. "respuestaCorrecta" (un solo
 * índice) pasa a "respuestas_correctas" (array de índices, guardado como
 * simple-json/text igual que "opciones") — cada pregunta existente se
 * migra a un array de un solo elemento, sin perder su respuesta correcta. */
export class QuizQuestionTypes1788542391996 implements MigrationInterface {
    name = 'QuizQuestionTypes1788542391996'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preguntas" ADD "tipo" character varying NOT NULL DEFAULT 'opcion_unica'`);
        await queryRunner.query(`ALTER TABLE "preguntas" ADD "respuestas_correctas" text`);
        await queryRunner.query(`UPDATE "preguntas" SET "respuestas_correctas" = '[' || "respuestaCorrecta" || ']'`);
        await queryRunner.query(`ALTER TABLE "preguntas" ALTER COLUMN "respuestas_correctas" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "preguntas" DROP COLUMN "respuestaCorrecta"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preguntas" ADD "respuestaCorrecta" integer`);
        // Solo recupera la respuesta si la pregunta tenía una única correcta
        // (opción única/verdadero-falso) — una de selección múltiple con
        // varias no puede volver a representarse en el esquema viejo.
        await queryRunner.query(`
            UPDATE "preguntas"
            SET "respuestaCorrecta" = ("respuestas_correctas"::json->>0)::int
            WHERE json_array_length("respuestas_correctas"::json) = 1
        `);
        await queryRunner.query(`ALTER TABLE "preguntas" ALTER COLUMN "respuestaCorrecta" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "preguntas" DROP COLUMN "respuestas_correctas"`);
        await queryRunner.query(`ALTER TABLE "preguntas" DROP COLUMN "tipo"`);
    }
}
