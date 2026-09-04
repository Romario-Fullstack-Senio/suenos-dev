import { MigrationInterface, QueryRunner } from "typeorm";

export class SupportTickets1788560000000 implements MigrationInterface {
    name = 'SupportTickets1788560000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tickets" ("id" uuid NOT NULL, "usuario_id" character varying NOT NULL, "usuario_nombre" character varying NOT NULL, "asunto" character varying NOT NULL, "categoria" character varying NOT NULL DEFAULT 'otro', "estado" character varying NOT NULL DEFAULT 'abierto', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tickets_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_usuario_id" ON "tickets" ("usuario_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_estado" ON "tickets" ("estado") `);
        await queryRunner.query(`CREATE TABLE "ticket_mensajes" ("id" uuid NOT NULL, "ticket_id" uuid NOT NULL, "autor_id" character varying NOT NULL, "autor_nombre" character varying NOT NULL, "autor_es_admin" boolean NOT NULL DEFAULT false, "texto" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ticket_mensajes_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_mensajes_ticket_id" ON "ticket_mensajes" ("ticket_id") `);
        await queryRunner.query(`ALTER TABLE "ticket_mensajes" ADD CONSTRAINT "FK_ticket_mensajes_ticket_id" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket_mensajes" DROP CONSTRAINT "FK_ticket_mensajes_ticket_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ticket_mensajes_ticket_id"`);
        await queryRunner.query(`DROP TABLE "ticket_mensajes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tickets_estado"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tickets_usuario_id"`);
        await queryRunner.query(`DROP TABLE "tickets"`);
    }

}
