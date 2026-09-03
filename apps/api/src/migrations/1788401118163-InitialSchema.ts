import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1788401118163 implements MigrationInterface {
    name = 'InitialSchema1788401118163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Requerido por los defaults uuid_generate_v4() de abajo. Ya existía en
        // la DB de desarrollo (creada implícitamente por `synchronize: true`
        // alguna vez), por eso no salió en el diff automático — pero una DB
        // nueva (CI, otra máquina, producción) no la tiene.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "ordenes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estudiante_id" character varying NOT NULL, "curso_id" character varying NOT NULL, "monto" numeric NOT NULL, "moneda" character varying NOT NULL, "stripe_session_id" character varying NOT NULL, "estado" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_58713affeb8e3b7b30b9eeeee7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fca884b6aab6fa8a8abeb1e330" ON "ordenes" ("estudiante_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c86633c7c45054e57567c5158a" ON "ordenes" ("curso_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ca00fdee39cb69d988b68231c0" ON "ordenes" ("stripe_session_id") `);
        await queryRunner.query(`CREATE TABLE "cupones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codigo" character varying NOT NULL, "tipo" character varying NOT NULL, "valor" numeric NOT NULL, "activo" boolean NOT NULL DEFAULT true, "curso_id" character varying, "fecha_expiracion" TIMESTAMP, "usos_maximos" integer, "usos_actuales" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a1b2382c67ad787ad6316e9f0cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5e11e0e4e948543f97ed85d457" ON "cupones" ("codigo") `);
        await queryRunner.query(`CREATE INDEX "IDX_f964f4d322f9287b89a2e800af" ON "cupones" ("curso_id") `);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" uuid NOT NULL, "nombre" character varying NOT NULL, "email" character varying NOT NULL, "password_hash" character varying, "rol" character varying NOT NULL DEFAULT 'estudiante', "auth_provider" character varying NOT NULL DEFAULT 'local', "provider_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inscripciones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estudiante_id" character varying NOT NULL, "curso_id" character varying NOT NULL, "fecha_inscripcion" TIMESTAMP NOT NULL DEFAULT now(), "activa" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_17a12f6ab342f6762d81e940d19" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_562e7adc0f4986a76bfc4243bc" ON "inscripciones" ("estudiante_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ca2673ce13cdc1695c39955cde" ON "inscripciones" ("curso_id") `);
        await queryRunner.query(`CREATE TABLE "progreso_lecciones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estudiante_id" character varying NOT NULL, "leccion_id" character varying NOT NULL, "curso_id" character varying NOT NULL, "porcentaje" double precision NOT NULL DEFAULT '0', "completada" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_75b7ed768eb4c03d0a97d36a4c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d347caf9aabfdc9dfa9c727ddb" ON "progreso_lecciones" ("estudiante_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_068b8b0a7bb3adeda392c482dc" ON "progreso_lecciones" ("leccion_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d0147bc3a6abc244f922ec1751" ON "progreso_lecciones" ("curso_id") `);
        await queryRunner.query(`CREATE TABLE "certificados" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estudiante_id" character varying NOT NULL, "curso_id" character varying NOT NULL, "estudiante_nombre" character varying NOT NULL, "curso_nombre" character varying NOT NULL, "fecha_emision" TIMESTAMP NOT NULL DEFAULT now(), "codigo_verificacion" character varying NOT NULL, CONSTRAINT "PK_e9b232ca7a16db08667f021708f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8e230f405d04c04cf2974db4b4" ON "certificados" ("estudiante_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_de6ad5977f507545fee5dba29c" ON "certificados" ("curso_id") `);
        await queryRunner.query(`CREATE TABLE "notificaciones" ("id" uuid NOT NULL, "usuario_id" character varying NOT NULL, "titulo" character varying NOT NULL, "mensaje" text NOT NULL, "tipo" character varying NOT NULL DEFAULT 'curso_publicado', "curso_id" uuid, "leida" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a9d32a419ff58b53a38b5ef85d4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2c6341d5bd206ff522b35aa6b6" ON "notificaciones" ("usuario_id") `);
        await queryRunner.query(`CREATE TABLE "cursos" ("id" uuid NOT NULL, "titulo" character varying NOT NULL, "descripcion" text NOT NULL, "precio" numeric(10,2) NOT NULL, "moneda" character varying NOT NULL DEFAULT 'USD', "slug" character varying NOT NULL, "estado" character varying NOT NULL DEFAULT 'borrador', "instructor_id" uuid NOT NULL, "imagen_url" character varying, "categoria" character varying, "nivel" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1a87ce612646b179313ec7da352" UNIQUE ("slug"), CONSTRAINT "PK_391c5a635ef6b4bd0a46cb75653" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7a12a4b80b57f3c3a0de859071" ON "cursos" ("instructor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6b078ec0dc1661b5f294b55e27" ON "cursos" ("categoria") `);
        await queryRunner.query(`CREATE INDEX "IDX_2ee701b05c14745e8952b43a8a" ON "cursos" ("nivel") `);
        await queryRunner.query(`CREATE TABLE "lecciones" ("id" uuid NOT NULL, "titulo" character varying NOT NULL, "orden" integer NOT NULL, "duracion_segundos" integer NOT NULL, "video_url" character varying, "modulo_id" uuid NOT NULL, CONSTRAINT "PK_8a02592ff90fd07b15c427390e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0b99738f9b22fb7c4d60065af7" ON "lecciones" ("modulo_id") `);
        await queryRunner.query(`CREATE TABLE "modulos" ("id" uuid NOT NULL, "titulo" character varying NOT NULL, "orden" integer NOT NULL, "curso_id" uuid NOT NULL, CONSTRAINT "PK_ba8d97b7acc232a928b1d686c5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c6adea160ff81d485be37bc7ca" ON "modulos" ("curso_id") `);
        await queryRunner.query(`CREATE TABLE "preguntas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "enunciado" character varying NOT NULL, "opciones" text NOT NULL, "respuestaCorrecta" integer NOT NULL, "quiz_id" uuid NOT NULL, CONSTRAINT "PK_f5ff09c997b51b1db2fe21e8ddb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5dbb785fdfe6ec53744ba508f1" ON "preguntas" ("quiz_id") `);
        await queryRunner.query(`CREATE TABLE "quizzes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titulo" character varying NOT NULL, "cursoId" character varying NOT NULL, "puntajeMinimo" integer NOT NULL, CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "intentos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estudiante_id" character varying NOT NULL, "quiz_id" character varying NOT NULL, "respuestas" text NOT NULL, "puntaje" numeric(5,2) NOT NULL, "aprobado" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cbce238fd69ec727306ebf3ae1e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_89f98b676776ba74807c120b34" ON "intentos" ("estudiante_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ee106660e800a4b1cb0b94c7a1" ON "intentos" ("quiz_id") `);
        await queryRunner.query(`ALTER TABLE "lecciones" ADD CONSTRAINT "FK_0b99738f9b22fb7c4d60065af7b" FOREIGN KEY ("modulo_id") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "modulos" ADD CONSTRAINT "FK_c6adea160ff81d485be37bc7caf" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "preguntas" ADD CONSTRAINT "FK_5dbb785fdfe6ec53744ba508f16" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preguntas" DROP CONSTRAINT "FK_5dbb785fdfe6ec53744ba508f16"`);
        await queryRunner.query(`ALTER TABLE "modulos" DROP CONSTRAINT "FK_c6adea160ff81d485be37bc7caf"`);
        await queryRunner.query(`ALTER TABLE "lecciones" DROP CONSTRAINT "FK_0b99738f9b22fb7c4d60065af7b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee106660e800a4b1cb0b94c7a1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89f98b676776ba74807c120b34"`);
        await queryRunner.query(`DROP TABLE "intentos"`);
        await queryRunner.query(`DROP TABLE "quizzes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5dbb785fdfe6ec53744ba508f1"`);
        await queryRunner.query(`DROP TABLE "preguntas"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c6adea160ff81d485be37bc7ca"`);
        await queryRunner.query(`DROP TABLE "modulos"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b99738f9b22fb7c4d60065af7"`);
        await queryRunner.query(`DROP TABLE "lecciones"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ee701b05c14745e8952b43a8a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6b078ec0dc1661b5f294b55e27"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7a12a4b80b57f3c3a0de859071"`);
        await queryRunner.query(`DROP TABLE "cursos"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2c6341d5bd206ff522b35aa6b6"`);
        await queryRunner.query(`DROP TABLE "notificaciones"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de6ad5977f507545fee5dba29c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8e230f405d04c04cf2974db4b4"`);
        await queryRunner.query(`DROP TABLE "certificados"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d0147bc3a6abc244f922ec1751"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_068b8b0a7bb3adeda392c482dc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d347caf9aabfdc9dfa9c727ddb"`);
        await queryRunner.query(`DROP TABLE "progreso_lecciones"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca2673ce13cdc1695c39955cde"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_562e7adc0f4986a76bfc4243bc"`);
        await queryRunner.query(`DROP TABLE "inscripciones"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f964f4d322f9287b89a2e800af"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e11e0e4e948543f97ed85d457"`);
        await queryRunner.query(`DROP TABLE "cupones"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca00fdee39cb69d988b68231c0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c86633c7c45054e57567c5158a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fca884b6aab6fa8a8abeb1e330"`);
        await queryRunner.query(`DROP TABLE "ordenes"`);
    }

}
