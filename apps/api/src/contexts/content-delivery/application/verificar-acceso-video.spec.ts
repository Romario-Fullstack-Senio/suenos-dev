import { VerificarAccesoVideoUseCase } from './verificar-acceso-video.use-case';
import { Inscripcion } from '../../enrollment/domain/inscripcion.entity';

describe('VerificarAccesoVideoUseCase', () => {
  let useCase: VerificarAccesoVideoUseCase;
  let mockCursoRepo: { findInfoByLeccionId: jest.Mock };
  let mockInscripcionRepo: { findByCursoYEstudiante: jest.Mock };

  beforeEach(() => {
    mockCursoRepo = { findInfoByLeccionId: jest.fn() };
    mockInscripcionRepo = { findByCursoYEstudiante: jest.fn() };
    useCase = new VerificarAccesoVideoUseCase(mockCursoRepo as any, mockInscripcionRepo as any);
  });

  it('devuelve existe:false si la lección no existe', async () => {
    mockCursoRepo.findInfoByLeccionId.mockResolvedValue(null);
    const result = await useCase.execute({ leccionId: 'no-existe' });
    expect(result).toEqual({ permitido: false, existe: false });
  });

  it('una lección de vista previa es accesible sin login', async () => {
    mockCursoRepo.findInfoByLeccionId.mockResolvedValue({ cursoId: 'c1', esVistaPrevia: true, instructorId: 'i1' });
    const result = await useCase.execute({ leccionId: 'l1' });
    expect(result).toEqual({ permitido: true, existe: true });
  });

  it('una lección normal sin usuario logueado no es accesible', async () => {
    mockCursoRepo.findInfoByLeccionId.mockResolvedValue({ cursoId: 'c1', esVistaPrevia: false, instructorId: 'i1' });
    const result = await useCase.execute({ leccionId: 'l1' });
    expect(result).toEqual({ permitido: false, existe: true });
  });

  it('un admin siempre tiene acceso', async () => {
    mockCursoRepo.findInfoByLeccionId.mockResolvedValue({ cursoId: 'c1', esVistaPrevia: false, instructorId: 'i1' });
    const result = await useCase.execute({ leccionId: 'l1', usuarioId: 'admin-1', usuarioRol: 'admin' });
    expect(result.permitido).toBe(true);
  });

  it('el instructor dueño del curso tiene acceso', async () => {
    mockCursoRepo.findInfoByLeccionId.mockResolvedValue({ cursoId: 'c1', esVistaPrevia: false, instructorId: 'instructor-1' });
    const result = await useCase.execute({ leccionId: 'l1', usuarioId: 'instructor-1', usuarioRol: 'instructor' });
    expect(result.permitido).toBe(true);
  });

  it('un estudiante inscripto y activo tiene acceso', async () => {
    mockCursoRepo.findInfoByLeccionId.mockResolvedValue({ cursoId: 'c1', esVistaPrevia: false, instructorId: 'i1' });
    mockInscripcionRepo.findByCursoYEstudiante.mockResolvedValue(Inscripcion.crear('ins1', 'estudiante-1', 'c1'));
    const result = await useCase.execute({ leccionId: 'l1', usuarioId: 'estudiante-1', usuarioRol: 'estudiante' });
    expect(result.permitido).toBe(true);
  });

  it('un estudiante con inscripción desactivada (reembolsada) NO tiene acceso', async () => {
    mockCursoRepo.findInfoByLeccionId.mockResolvedValue({ cursoId: 'c1', esVistaPrevia: false, instructorId: 'i1' });
    const inscripcionDesactivada = Inscripcion.crear('ins1', 'estudiante-1', 'c1');
    inscripcionDesactivada.desactivar();
    mockInscripcionRepo.findByCursoYEstudiante.mockResolvedValue(inscripcionDesactivada);
    const result = await useCase.execute({ leccionId: 'l1', usuarioId: 'estudiante-1', usuarioRol: 'estudiante' });
    expect(result.permitido).toBe(false);
  });

  it('un estudiante no inscripto NO tiene acceso', async () => {
    mockCursoRepo.findInfoByLeccionId.mockResolvedValue({ cursoId: 'c1', esVistaPrevia: false, instructorId: 'i1' });
    mockInscripcionRepo.findByCursoYEstudiante.mockResolvedValue(null);
    const result = await useCase.execute({ leccionId: 'l1', usuarioId: 'estudiante-2', usuarioRol: 'estudiante' });
    expect(result.permitido).toBe(false);
  });

  describe('liberación programada (drip)', () => {
    it('bloquea una lección que todavía no se liberó (inscripto hoy, se libera a los 7 días)', async () => {
      mockCursoRepo.findInfoByLeccionId.mockResolvedValue({
        cursoId: 'c1',
        esVistaPrevia: false,
        instructorId: 'i1',
        diasDesdeInscripcion: 7,
      });
      mockInscripcionRepo.findByCursoYEstudiante.mockResolvedValue(Inscripcion.crear('ins1', 'estudiante-1', 'c1'));

      const result = await useCase.execute({ leccionId: 'l1', usuarioId: 'estudiante-1', usuarioRol: 'estudiante' });
      expect(result.permitido).toBe(false);
      expect(result.existe).toBe(true);
    });

    it('permite una lección con drip cuando ya pasaron los días requeridos', async () => {
      mockCursoRepo.findInfoByLeccionId.mockResolvedValue({
        cursoId: 'c1',
        esVistaPrevia: false,
        instructorId: 'i1',
        diasDesdeInscripcion: 7,
      });
      const inscripcion = Inscripcion.crear('ins1', 'estudiante-1', 'c1');
      // Simula una inscripción de hace 10 días — ya pasó el umbral de 7.
      Object.defineProperty(inscripcion, 'props', {
        value: { ...(inscripcion as any).props, fechaInscripcion: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      });
      mockInscripcionRepo.findByCursoYEstudiante.mockResolvedValue(inscripcion);

      const result = await useCase.execute({ leccionId: 'l1', usuarioId: 'estudiante-1', usuarioRol: 'estudiante' });
      expect(result.permitido).toBe(true);
    });

    it('el instructor y el admin ignoran la liberación programada', async () => {
      mockCursoRepo.findInfoByLeccionId.mockResolvedValue({
        cursoId: 'c1',
        esVistaPrevia: false,
        instructorId: 'instructor-1',
        diasDesdeInscripcion: 30,
      });
      const result = await useCase.execute({ leccionId: 'l1', usuarioId: 'instructor-1', usuarioRol: 'instructor' });
      expect(result.permitido).toBe(true);
    });
  });
});
