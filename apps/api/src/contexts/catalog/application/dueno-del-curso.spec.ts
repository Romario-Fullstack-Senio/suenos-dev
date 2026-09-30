import { PublicarCursoUseCase } from './publicar-curso.use-case';
import { AgregarModuloUseCase } from './agregar-modulo.use-case';
import { AgregarLeccionUseCase } from './agregar-leccion.use-case';
import { Curso } from '../domain/curso.entity';
import { Modulo } from '../domain/modulo.entity';

// Regresión: publicar / agregar módulo / agregar lección solo exigían el rol
// instructor, no ser el DUEÑO del curso — cualquier instructor podía
// modificar cursos ajenos.

function crearCursoConModulo(instructorId = 'instructor-1') {
  const curso = Curso.create('curso-1', {
    titulo: 'Curso de React',
    descripcion: 'Aprende React',
    precio: 49.99,
    instructorId,
  });
  curso.agregarModulo(Modulo.create('mod-1', 'Intro', 1));
  return curso;
}

describe('PublicarCursoUseCase — dueño del curso', () => {
  let useCase: PublicarCursoUseCase;
  let mockRepo: { findById: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    mockRepo = { findById: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new PublicarCursoUseCase(mockRepo as any, { publish: jest.fn() } as any);
  });

  it('el instructor dueño puede publicar su curso', async () => {
    mockRepo.findById.mockResolvedValue(crearCursoConModulo('instructor-1'));
    await useCase.execute('curso-1', 'instructor-1', 'instructor');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('un admin puede publicar cualquier curso', async () => {
    mockRepo.findById.mockResolvedValue(crearCursoConModulo('instructor-1'));
    await useCase.execute('curso-1', 'admin-1', 'admin');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('otro instructor NO puede publicar un curso ajeno', async () => {
    mockRepo.findById.mockResolvedValue(crearCursoConModulo('instructor-1'));
    await expect(useCase.execute('curso-1', 'otro-instructor', 'instructor')).rejects.toThrow(
      'No tienes permiso para publicar este curso',
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});

describe('AgregarModuloUseCase — dueño del curso', () => {
  let useCase: AgregarModuloUseCase;
  let mockRepo: { findById: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    mockRepo = { findById: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new AgregarModuloUseCase(mockRepo as any);
  });

  it('el dueño puede agregar un módulo', async () => {
    mockRepo.findById.mockResolvedValue(crearCursoConModulo('instructor-1'));
    await useCase.execute({ cursoId: 'curso-1', callerId: 'instructor-1', callerRol: 'instructor', titulo: 'Hooks', orden: 2 });
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('otro instructor NO puede agregar módulos a un curso ajeno', async () => {
    mockRepo.findById.mockResolvedValue(crearCursoConModulo('instructor-1'));
    await expect(
      useCase.execute({ cursoId: 'curso-1', callerId: 'otro-instructor', callerRol: 'instructor', titulo: 'X', orden: 2 }),
    ).rejects.toThrow('No tienes permiso para editar este curso');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});

describe('AgregarLeccionUseCase — dueño del curso', () => {
  let useCase: AgregarLeccionUseCase;
  let mockRepo: { findById: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    mockRepo = { findById: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new AgregarLeccionUseCase(mockRepo as any);
  });

  it('el dueño puede agregar una lección', async () => {
    mockRepo.findById.mockResolvedValue(crearCursoConModulo('instructor-1'));
    await useCase.execute({
      cursoId: 'curso-1',
      moduloId: 'mod-1',
      callerId: 'instructor-1',
      callerRol: 'instructor',
      titulo: 'useState',
      orden: 1,
      duracionSegundos: 300,
    });
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('otro instructor NO puede agregar lecciones a un curso ajeno', async () => {
    mockRepo.findById.mockResolvedValue(crearCursoConModulo('instructor-1'));
    await expect(
      useCase.execute({
        cursoId: 'curso-1',
        moduloId: 'mod-1',
        callerId: 'otro-instructor',
        callerRol: 'instructor',
        titulo: 'X',
        orden: 1,
        duracionSegundos: 300,
      }),
    ).rejects.toThrow('No tienes permiso para editar este curso');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
