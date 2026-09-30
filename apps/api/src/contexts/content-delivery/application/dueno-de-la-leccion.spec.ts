import { ForbiddenException } from '@nestjs/common';
import { SubirVideoUseCase } from './subir-video.use-case';
import { SubirSubtitulosUseCase } from './subir-subtitulos.use-case';
import { SubirRecursoUseCase } from './subir-recurso.use-case';
import { EliminarRecursoUseCase } from './eliminar-recurso.use-case';

// Regresión: subir/borrar video, subtítulos y recursos solo exigían el rol
// instructor — cualquier instructor podía pisar el contenido de una lección
// de OTRO instructor con solo conocer el leccionId. Además el chequeo tiene
// que pasar ANTES de subir a MinIO, no después.

const INFO_LECCION = { cursoId: 'curso-1', instructorId: 'instructor-1', esVistaPrevia: false, diasDesdeInscripcion: 0 };
const AJENO = { id: 'otro-instructor', rol: 'instructor' };

function crearMocks() {
  const videoStorage = {
    upload: jest.fn(),
    uploadSubtitulos: jest.fn(),
    uploadRecurso: jest.fn(),
    deleteRecurso: jest.fn(),
  };
  const cursoRepository = {
    findInfoByLeccionId: jest.fn().mockResolvedValue(INFO_LECCION),
    findById: jest.fn(),
    save: jest.fn(),
  };
  return { videoStorage, cursoRepository };
}

describe('Contenido de lecciones — solo el dueño del curso', () => {
  it('SubirVideoUseCase rechaza a otro instructor sin subir nada a MinIO', async () => {
    const { videoStorage, cursoRepository } = crearMocks();
    const useCase = new SubirVideoUseCase(videoStorage as any, cursoRepository as any);

    await expect(useCase.execute(Buffer.from('x'), 'leccion-1', AJENO)).rejects.toBeInstanceOf(ForbiddenException);
    expect(videoStorage.upload).not.toHaveBeenCalled();
    expect(cursoRepository.save).not.toHaveBeenCalled();
  });

  it('SubirSubtitulosUseCase rechaza a otro instructor sin subir nada a MinIO', async () => {
    const { videoStorage, cursoRepository } = crearMocks();
    const useCase = new SubirSubtitulosUseCase(videoStorage as any, cursoRepository as any);

    await expect(useCase.execute(Buffer.from('WEBVTT'), 'leccion-1', AJENO)).rejects.toBeInstanceOf(ForbiddenException);
    expect(videoStorage.uploadSubtitulos).not.toHaveBeenCalled();
  });

  it('SubirRecursoUseCase rechaza a otro instructor sin subir nada a MinIO', async () => {
    const { videoStorage, cursoRepository } = crearMocks();
    const useCase = new SubirRecursoUseCase(videoStorage as any, cursoRepository as any);

    await expect(
      useCase.execute(Buffer.from('%PDF'), 'leccion-1', 'Guía', 'guia.pdf', AJENO),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(videoStorage.uploadRecurso).not.toHaveBeenCalled();
  });

  it('EliminarRecursoUseCase rechaza a otro instructor sin borrar nada', async () => {
    const { videoStorage, cursoRepository } = crearMocks();
    const useCase = new EliminarRecursoUseCase(videoStorage as any, cursoRepository as any);

    await expect(useCase.execute('leccion-1', 'guia.pdf', AJENO)).rejects.toBeInstanceOf(ForbiddenException);
    expect(videoStorage.deleteRecurso).not.toHaveBeenCalled();
  });

  it('un admin pasa el chequeo (llega a subir el video)', async () => {
    const { videoStorage, cursoRepository } = crearMocks();
    videoStorage.upload.mockResolvedValue('url');
    cursoRepository.findById.mockResolvedValue(null); // corta después de subir
    const useCase = new SubirVideoUseCase(videoStorage as any, cursoRepository as any);

    await expect(useCase.execute(Buffer.from('x'), 'leccion-1', { id: 'admin-1', rol: 'admin' })).rejects.toThrow(
      'Curso no encontrado',
    );
    expect(videoStorage.upload).toHaveBeenCalledTimes(1);
  });
});
