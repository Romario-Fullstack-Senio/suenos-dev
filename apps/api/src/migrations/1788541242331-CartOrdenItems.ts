import { MigrationInterface, QueryRunner } from "typeorm";

/** El carrito permite comprar varios cursos en una sola orden — "ordenes"
 * pasa de tener un curso_id/monto propios a tener N filas en "orden_items"
 * (una por curso), con Orden.monto ahora derivado de la suma de sus ítems.
 *
 * Esta migración preserva el historial: cada orden existente se convierte
 * en un orden_item con el mismo curso_id/monto que tenía, antes de borrar
 * esas columnas de "ordenes" — ninguna orden real pierde su curso ni su
 * importe. */
export class CartOrdenItems1788541242331 implements MigrationInterface {
    name = 'CartOrdenItems1788541242331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "orden_items" (
                "id" uuid NOT NULL,
                "orden_id" uuid NOT NULL,
                "curso_id" character varying NOT NULL,
                "curso_nombre" character varying NOT NULL,
                "precio" decimal NOT NULL,
                CONSTRAINT "PK_orden_items_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_orden_items_orden_id" ON "orden_items" ("orden_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_orden_items_curso_id" ON "orden_items" ("curso_id")`);
        await queryRunner.query(`
            ALTER TABLE "orden_items"
            ADD CONSTRAINT "FK_orden_items_orden_id" FOREIGN KEY ("orden_id")
            REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Backfill: una fila por orden existente, con el nombre del curso
        // resuelto desde "cursos" (o "Curso" si en algún caso raro ya no
        // existe el curso).
        await queryRunner.query(`
            INSERT INTO "orden_items" ("id", "orden_id", "curso_id", "curso_nombre", "precio")
            SELECT uuid_generate_v4(), o."id", o."curso_id", COALESCE(c."titulo", 'Curso'), o."monto"
            FROM "ordenes" o
            LEFT JOIN "cursos" c ON c."id"::varchar = o."curso_id"
        `);

        await queryRunner.query(`ALTER TABLE "ordenes" DROP COLUMN "curso_id"`);
        await queryRunner.query(`ALTER TABLE "ordenes" DROP COLUMN "monto"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes" ADD "monto" decimal`);
        await queryRunner.query(`ALTER TABLE "ordenes" ADD "curso_id" character varying`);

        // Solo recupera curso_id/monto si la orden tenía exactamente un
        // ítem — una orden de carrito con varios cursos no puede volver a
        // representarse en el esquema viejo de 1 orden = 1 curso.
        await queryRunner.query(`
            UPDATE "ordenes" o
            SET "curso_id" = i."curso_id", "monto" = i."precio"
            FROM "orden_items" i
            WHERE i."orden_id" = o."id"
            AND (SELECT count(*) FROM "orden_items" WHERE "orden_id" = o."id") = 1
        `);

        await queryRunner.query(`ALTER TABLE "ordenes" ALTER COLUMN "curso_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ordenes" ALTER COLUMN "monto" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_ordenes_curso_id" ON "ordenes" ("curso_id")`);

        await queryRunner.query(`ALTER TABLE "orden_items" DROP CONSTRAINT "FK_orden_items_orden_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orden_items_curso_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orden_items_orden_id"`);
        await queryRunner.query(`DROP TABLE "orden_items"`);
    }
}
