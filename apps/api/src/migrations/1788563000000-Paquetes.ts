import { MigrationInterface, QueryRunner } from "typeorm";

export class Paquetes1788563000000 implements MigrationInterface {
    name = 'Paquetes1788563000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "paquetes" ("id" uuid NOT NULL, "titulo" character varying NOT NULL, "descripcion" text NOT NULL DEFAULT '', "curso_ids" text NOT NULL, "descuento_porcentaje" integer NOT NULL, "activo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_paquetes_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "paquetes"`);
    }

}
