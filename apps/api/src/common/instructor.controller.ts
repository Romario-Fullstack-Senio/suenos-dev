import { Controller, Get, Inject, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CURSO_REPOSITORY, CursoRepository } from '../contexts/catalog/domain/curso.repository.port';
import { INSCRIPCION_REPOSITORY, InscripcionRepository } from '../contexts/enrollment/domain/inscripcion.repository.port';
import { ORDEN_REPOSITORY, OrdenRepository } from '../contexts/payments/domain/orden.repository.port';
import {
  PROGRESO_LECCION_REPOSITORY,
  ProgresoLeccionRepository,
} from '../contexts/content-delivery/domain/progreso-leccion.repository.port';

const DIAS_HISTORIAL_INGRESOS = 30;
const UMBRAL_FINALIZACION = 90; // % de lecciones completadas para contar el curso como "terminado"

@Controller('instructor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('instructor')
export class InstructorController {
  constructor(
    @Inject(CURSO_REPOSITORY)
    private readonly cursoRepository: CursoRepository,
    @Inject(INSCRIPCION_REPOSITORY)
    private readonly inscripcionRepository: InscripcionRepository,
    @Inject(ORDEN_REPOSITORY)
    private readonly ordenRepository: OrdenRepository,
    @Inject(PROGRESO_LECCION_REPOSITORY)
    private readonly progresoRepository: ProgresoLeccionRepository,
  ) {}

  @Get('stats/:instructorId')
  async getStats(@Param('instructorId') instructorId: string) {
    const cursos = await this.cursoRepository.findByInstructorId(instructorId);
    const cursoIds = cursos.map(c => c.id);
    const ordenes = await this.ordenRepository.findByCursoIds(cursoIds);
    const cursoIdSet = new Set(cursoIds);

    let totalInscripciones = 0;
    for (const curso of cursos) {
      const inscripciones = await this.inscripcionRepository.findByCursoId(curso.id);
      totalInscripciones += inscripciones.filter(i => i.activa).length;
    }

    // Ingresos reales (Ordenes completadas, netas de reembolsos) — antes era
    // una estimación (inscripciones × precio actual del curso), que no
    // reflejaba cupones aplicados ni cambios de precio históricos. Con el
    // carrito, una orden puede traer cursos de otros instructores también
    // — solo suma los ítems que son de ESTE instructor, no orden.monto
    // completo (que sería el total del carrito entero).
    const ingresosReales = ordenes
      .filter(o => o.estado === 'completada')
      .flatMap(o => o.items)
      .filter(item => cursoIdSet.has(item.cursoId))
      .reduce((sum, item) => sum + item.precio, 0);

    return {
      totalCursos: cursos.length,
      totalInscripciones,
      ingresosEstimados: ingresosReales,
    };
  }

  @Get('analytics/:instructorId')
  async getAnalytics(@Param('instructorId') instructorId: string) {
    const cursos = await this.cursoRepository.findByInstructorId(instructorId);
    const cursoIds = cursos.map(c => c.id);
    const ordenes = await this.ordenRepository.findByCursoIds(cursoIds);
    const cursoIdSet = new Set(cursoIds);
    const ordenesCompletadas = ordenes.filter(o => o.estado === 'completada');
    // Ítems de este instructor, con la fecha de la orden a la que pertenecen
    // (para el gráfico por día) — un ítem no tiene su propia createdAt.
    const itemsDelInstructor = ordenesCompletadas.flatMap(o =>
      o.items.filter(item => cursoIdSet.has(item.cursoId)).map(item => ({ item, createdAt: o.createdAt })),
    );

    // Ingresos por día, últimos 30 días (para el gráfico de evolución).
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const ingresosPorDia: { fecha: string; monto: number }[] = [];
    for (let i = DIAS_HISTORIAL_INGRESOS - 1; i >= 0; i--) {
      const dia = new Date(hoy);
      dia.setDate(dia.getDate() - i);
      const diaSiguiente = new Date(dia);
      diaSiguiente.setDate(diaSiguiente.getDate() + 1);

      const monto = itemsDelInstructor
        .filter(({ createdAt }) => createdAt >= dia && createdAt < diaSiguiente)
        .reduce((sum, { item }) => sum + item.precio, 0);

      ingresosPorDia.push({ fecha: dia.toISOString().slice(0, 10), monto: Math.round(monto * 100) / 100 });
    }

    // Ventas por curso (para saber de dónde viene la plata).
    const ventasPorCurso = cursos.map(curso => {
      const itemsDelCurso = itemsDelInstructor.filter(({ item }) => item.cursoId === curso.id);
      return {
        cursoId: curso.id,
        cursoNombre: curso.titulo,
        ventas: itemsDelCurso.length,
        ingresos: Math.round(itemsDelCurso.reduce((sum, { item }) => sum + item.precio, 0) * 100) / 100,
      };
    });

    // Tasa de finalización por curso: de los inscriptos activos, cuántos
    // completaron (>=90%) todas las lecciones del curso.
    const tasaFinalizacionPorCurso = [];
    for (const curso of cursos) {
      const inscripciones = (await this.inscripcionRepository.findByCursoId(curso.id)).filter(i => i.activa);
      const totalLecciones = curso.modulos.reduce((sum, m) => sum + m.lecciones.length, 0);

      let completaron = 0;
      if (totalLecciones > 0) {
        const progresos = await this.progresoRepository.findByCursoId(curso.id);
        const progresoPorEstudiante = new Map<string, number>();
        for (const p of progresos) {
          if (p.completada) {
            progresoPorEstudiante.set(p.estudianteId, (progresoPorEstudiante.get(p.estudianteId) ?? 0) + 1);
          }
        }
        for (const inscripcion of inscripciones) {
          const leccionesCompletadas = progresoPorEstudiante.get(inscripcion.estudianteId) ?? 0;
          if ((leccionesCompletadas / totalLecciones) * 100 >= UMBRAL_FINALIZACION) {
            completaron++;
          }
        }
      }

      tasaFinalizacionPorCurso.push({
        cursoId: curso.id,
        cursoNombre: curso.titulo,
        inscriptos: inscripciones.length,
        completaron,
        tasa: inscripciones.length > 0 ? Math.round((completaron / inscripciones.length) * 1000) / 10 : 0,
      });
    }

    return { ingresosPorDia, ventasPorCurso, tasaFinalizacionPorCurso };
  }
}
