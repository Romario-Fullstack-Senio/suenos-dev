import { MigrationInterface, QueryRunner } from "typeorm";

export class ComisionesAfiliados1788569000000 implements MigrationInterface {
    name = 'ComisionesAfiliados1788569000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "comisiones_afiliados" (
                "id" uuid NOT NULL,
                "afiliado_id" character varying NOT NULL,
                "referido_id" character varying NOT NULL,
                "curso_id" character varying NOT NULL,
                "curso_nombre" character varying NOT NULL,
                "orden_id" character varying NOT NULL,
                "monto" numeric NOT NULL,
                "comision_monto" numeric NOT NULL,
                "estado" character varying NOT NULL DEFAULT 'pendiente',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_comisiones_afiliados" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_comisiones_afiliados_afiliado_id" ON "comisiones_afiliados" ("afiliado_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_comisiones_afiliados_referido_id" ON "comisiones_afiliados" ("referido_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_comisiones_afiliados_estado" ON "comisiones_afiliados" ("estado")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "comisiones_afiliados"`);
    }

}
