import { EditarCursoUseCase } from './editar-curso.use-case';
import { CambiarEstadoCursoUseCase } from './cambiar-estado-curso.use-case';
import { EliminarCursoUseCase } from './eliminar-curso.use-case';
import { Curso } from '../domain/curso.entity';
import { Modulo } from '../domain/modulo.entity';

function crearCurso(instructorId = 'instructor-1') {
  return Curso.create('curso-1', {
    titulo: 'Curso de React',
    descripcion: 'Aprende React',
    precio: 49.99,
    instructorId,
  });
}

describe('EditarCursoUseCase', () => {
  let useCase: EditarCursoUseCase;
  let mockRepo: { findById: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    mockRepo = { findById: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new EditarCursoUseCase(mockRepo as any);
  });

  it('el instructor dueño puede editar su curso', async () => {
    mockRepo.findById.mockResolvedValue(crearCurso('instructor-1'));

    await useCase.execute({ cursoId: 'curso-1', callerId: 'instructor-1', callerRol: 'instructor', precio: 19.99 });

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save.mock.calls[0][0].precio.value).toBe(19.99);
  });

  it('un admin puede editar cualquier curso', async () => {
    mockRepo.findById.mockResolvedValue(crearCurso('instructor-1'));

    await expect(
      useCase.execute({ cursoId: 'curso-1', callerId: 'admin-1', callerRol: 'admin', precio: 19.99 }),
    ).resolves.not.toThrow();
  });

  it('otro instructor NO puede editar un curso ajeno', async () => {
    mockRepo.findById.mockResolvedValue(crearCurso('instructor-1'));

    await expect(
      useCase.execute({ cursoId: 'curso-1', callerId: 'otro-instructor', callerRol: 'instructor', precio: 1 }),
    ).rejects.toThrow('No tienes permiso para editar este curso');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});

describe('CambiarEstadoCursoUseCase', () => {
  let useCase: CambiarEstadoCursoUseCase;
  let mockRepo: { findById: jest.Mock; save: jest.Mock };
  let mockEventBus: { publish: jest.Mock };

  beforeEach(() => {
    mockRepo = { findById: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };
    useCase = new CambiarEstadoCursoUseCase(mockRepo as any, mockEventBus as any);
  });

  it('el botón publicar/despublicar del admin ahora tiene una ruta real que funciona', async () => {
    const curso = crearCurso();
    curso.agregarModulo(Modulo.create('mod-1', 'Intro', 1));
    mockRepo.findById.mockResolvedValue(curso);

    await useCase.execute({ cursoId: 'curso-1', callerId: 'admin-1', callerRol: 'admin', estado: 'publicado' });
    expect(curso.estado.value).toBe('publicado');

    await useCase.execute({ cursoId: 'curso-1', callerId: 'admin-1', callerRol: 'admin', estado: 'borrador' });
    expect(curso.estado.value).toBe('borrador');
  });

  it('otro instructor no puede cambiar el estado de un curso ajeno', async () => {
    mockRepo.findById.mockResolvedValue(crearCurso('instructor-1'));

    await expect(
      useCase.execute({ cursoId: 'curso-1', callerId: 'otro', callerRol: 'instructor', estado: 'borrador' }),
    ).rejects.toThrow('No tienes permiso para modificar este curso');
  });
});

describe('EliminarCursoUseCase', () => {
  let useCase: EliminarCursoUseCase;
  let mockRepo: { findById: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    mockRepo = { findById: jest.fn(), delete: jest.fn().mockResolvedValue(undefined) };
    useCase = new EliminarCursoUseCase(mockRepo as any);
  });

  it('el instructor dueño puede eliminar su curso', async () => {
    mockRepo.findById.mockResolvedValue(crearCurso('instructor-1'));

    await useCase.execute({ cursoId: 'curso-1', callerId: 'instructor-1', callerRol: 'instructor' });

    expect(mockRepo.delete).toHaveBeenCalledWith('curso-1');
  });

  it('otro instructor no puede eliminar un curso ajeno', async () => {
    mockRepo.findById.mockResolvedValue(crearCurso('instructor-1'));

    await expect(
      useCase.execute({ cursoId: 'curso-1', callerId: 'otro', callerRol: 'instructor' }),
    ).rejects.toThrow('No tienes permiso para eliminar este curso');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('lanza NotFoundDomainError si el curso no existe', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ cursoId: 'no-existe', callerId: 'x', callerRol: 'instructor' }),
    ).rejects.toThrow('Curso no encontrado');
  });
});
