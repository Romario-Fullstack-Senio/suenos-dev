import { MigrationInterface, QueryRunner } from "typeorm";

export class Wishlist1788541403869 implements MigrationInterface {
    name = 'Wishlist1788541403869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orden_items" DROP CONSTRAINT "FK_orden_items_orden_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orden_items_orden_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orden_items_curso_id"`);
        await queryRunner.query(`CREATE TABLE "favoritos" ("id" uuid NOT NULL, "usuario_id" character varying NOT NULL, "curso_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2a6a4d0119130451dc0b644590a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a5437f5339df26be381a7df84b" ON "favoritos" ("usuario_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dd70677681259f4ec5a044ecf" ON "favoritos" ("curso_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1159422d4ec95394cb784929f4" ON "favoritos" ("usuario_id", "curso_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0338075bbe6b4213477f145d66" ON "orden_items" ("orden_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ed7d7e85c4c8c4fc7b25ba2d32" ON "orden_items" ("curso_id") `);
        await queryRunner.query(`ALTER TABLE "orden_items" ADD CONSTRAINT "FK_0338075bbe6b4213477f145d661" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orden_items" DROP CONSTRAINT "FK_0338075bbe6b4213477f145d661"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed7d7e85c4c8c4fc7b25ba2d32"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0338075bbe6b4213477f145d66"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1159422d4ec95394cb784929f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2dd70677681259f4ec5a044ecf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5437f5339df26be381a7df84b"`);
        await queryRunner.query(`DROP TABLE "favoritos"`);
        await queryRunner.query(`CREATE INDEX "IDX_orden_items_curso_id" ON "orden_items" ("curso_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_orden_items_orden_id" ON "orden_items" ("orden_id") `);
        await queryRunner.query(`ALTER TABLE "orden_items" ADD CONSTRAINT "FK_orden_items_orden_id" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
