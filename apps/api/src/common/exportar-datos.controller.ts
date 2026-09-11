import { Controller, Get, Inject, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import type { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../contexts/identity/domain/usuario.repository.port';
import { INSCRIPCION_REPOSITORY, InscripcionRepository } from '../contexts/enrollment/domain/inscripcion.repository.port';
import { CERTIFICADO_REPOSITORY, CertificadoRepository } from '../contexts/certification/domain/certificado.repository.port';
import { ORDEN_REPOSITORY, OrdenRepository } from '../contexts/payments/domain/orden.repository.port';
import { RESENA_REPOSITORY, ResenaRepository } from '../contexts/reviews/domain/resena.repository.port';
import { PREGUNTA_REPOSITORY, PreguntaRepository } from '../contexts/qa/domain/pregunta.repository.port';
import { FAVORITO_REPOSITORY, FavoritoRepository } from '../contexts/wishlist/domain/favorito.repository.port';
import { TICKET_REPOSITORY, TicketRepository } from '../contexts/support/domain/ticket.repository.port';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; rol: string };
}

/** GDPR Art. 20 (portabilidad de datos) — la otra mitad de lo que ya hace
 * `DELETE /usuarios/me` (que anonimiza, no exporta). Junta en un solo JSON
 * todo lo que la plataforma sabe del usuario autenticado, cruzando los
 * contextos igual que InstructorController/AdminController: cada
 * repositorio se inyecta por su puerto, sin pasar por eventos ni acoplar
 * los módulos entre sí — esto es una lectura agregada, no un comando que
 * cambia estado en otro contexto. */
@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class ExportarDatosController {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepo: UsuarioRepository,
    @Inject(INSCRIPCION_REPOSITORY) private readonly inscripcionRepo: InscripcionRepository,
    @Inject(CERTIFICADO_REPOSITORY) private readonly certificadoRepo: CertificadoRepository,
    @Inject(ORDEN_REPOSITORY) private readonly ordenRepo: OrdenRepository,
    @Inject(RESENA_REPOSITORY) private readonly resenaRepo: ResenaRepository,
    @Inject(PREGUNTA_REPOSITORY) private readonly preguntaRepo: PreguntaRepository,
    @Inject(FAVORITO_REPOSITORY) private readonly favoritoRepo: FavoritoRepository,
    @Inject(TICKET_REPOSITORY) private readonly ticketRepo: TicketRepository,
  ) {}

  // Límite bajo: es una operación pesada (una decena de queries) pensada
  // para uso ocasional, no para sondear el endpoint repetidamente.
  @Get('me/exportar')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  async exportar(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const usuarioId = req.user.id;

    const [usuario, inscripciones, certificados, ordenes, resenas, preguntas, favoritos, tickets] = await Promise.all([
      this.usuarioRepo.findById(usuarioId),
      this.inscripcionRepo.findAllByEstudiante(usuarioId),
      this.certificadoRepo.findByEstudianteId(usuarioId),
      this.ordenRepo.findByEstudianteId(usuarioId),
      this.resenaRepo.findByEstudianteId(usuarioId),
      this.preguntaRepo.findByAutorId(usuarioId),
      this.favoritoRepo.findByUsuario(usuarioId),
      this.ticketRepo.findByUsuarioId(usuarioId),
    ]);

    const payload = {
      generadoEn: new Date().toISOString(),
      perfil: usuario && {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email.value,
        rol: usuario.rol.value,
        emailVerificado: usuario.emailVerificado,
        avatarUrl: usuario.avatarUrl,
        notificarCursoNuevo: usuario.notificarCursoNuevo,
        autenticacionDosFactores: usuario.twoFactorEnabled,
        proveedorAuth: usuario.authProvider.value,
        fechaRegistro: usuario.createdAt,
      },
      inscripciones: inscripciones.map((i) => ({
        cursoId: i.cursoId,
        fechaInscripcion: i.fechaInscripcion,
        activa: i.activa,
      })),
      certificados: certificados.map((c) => ({
        id: c.id,
        cursoId: c.cursoId,
        cursoNombre: c.cursoNombre,
        fechaEmision: c.fechaEmision,
        codigoVerificacion: c.codigoVerificacion,
      })),
      ordenes: ordenes.map((o) => ({
        id: o.id,
        items: o.items.map((it) => ({ cursoId: it.cursoId, cursoNombre: it.cursoNombre, precio: it.precio })),
        moneda: o.moneda,
        monto: o.monto,
        estado: o.estado,
        fecha: o.createdAt,
      })),
      resenas: resenas.map((r) => ({
        cursoId: r.cursoId,
        calificacion: r.calificacion,
        comentario: r.comentario,
        fecha: r.createdAt,
      })),
      preguntas: preguntas.map((p) => ({
        cursoId: p.cursoId,
        leccionId: p.leccionId,
        texto: p.texto,
        resuelta: p.resuelta,
        fecha: p.createdAt,
        respuestasRecibidas: p.respuestas.length,
      })),
      favoritos: favoritos.map((f) => ({ cursoId: f.cursoId, fecha: f.createdAt })),
      tickets: tickets.map((t) => ({
        id: t.id,
        asunto: t.asunto,
        categoria: t.categoria,
        estado: t.estado,
        fecha: t.createdAt,
        mensajes: t.mensajes.map((m) => ({
          texto: m.texto,
          autorNombre: m.autorNombre,
          autorEsAdmin: m.autorEsAdmin,
          fecha: m.createdAt,
        })),
      })),
    };

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="mis-datos-suenos-dev.json"',
    });
    res.send(JSON.stringify(payload, null, 2));
  }
}
