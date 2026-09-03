import { Curso } from './curso.entity';
import { Modulo } from './modulo.entity';

function crearCurso() {
  return Curso.create('curso-1', {
    titulo: 'Curso de React',
    descripcion: 'Aprende React',
    precio: 49.99,
    instructorId: 'instructor-1',
  });
}

describe('Curso.actualizar', () => {
  it('actualiza solo los campos provistos, deja el resto igual', () => {
    const curso = crearCurso();
    curso.actualizar({ precio: 29.99 });

    expect(curso.precio.value).toBe(29.99);
    expect(curso.titulo).toBe('Curso de React'); // sin cambios
    expect(curso.descripcion).toBe('Aprende React'); // sin cambios
  });

  it('regenera el slug cuando cambia el título', () => {
    const curso = crearCurso();
    curso.actualizar({ titulo: 'Curso de Vue' });

    expect(curso.titulo).toBe('Curso de Vue');
    expect(curso.slug.value).toContain('vue');
  });

  it('rechaza un título de menos de 3 caracteres', () => {
    const curso = crearCurso();
    expect(() => curso.actualizar({ titulo: 'ab' })).toThrow('El título debe tener al menos 3 caracteres');
  });

  it('actualiza la imagen de portada', () => {
    const curso = crearCurso();
    curso.actualizar({ imagenUrl: 'http://localhost:9000/suenos-dev/covers/x.png' });
    expect(curso.imagenUrl).toBe('http://localhost:9000/suenos-dev/covers/x.png');
  });
});

describe('Curso.publicar / despublicar', () => {
  it('publicar() falla sin módulos', () => {
    const curso = crearCurso();
    expect(() => curso.publicar()).toThrow('Un curso debe tener al menos un módulo para ser publicado');
  });

  it('publicar() funciona con al menos un módulo y emite CursoPublicado', () => {
    const curso = crearCurso();
    curso.agregarModulo(Modulo.create('mod-1', 'Introducción', 1));

    curso.publicar();

    expect(curso.estado.value).toBe('publicado');
    const eventos = curso.pullDomainEvents();
    expect(eventos).toHaveLength(1);
    expect(eventos[0].eventName).toBe('CursoPublicado');
  });

  it('despublicar() vuelve el curso a borrador sin restricciones ni eventos', () => {
    const curso = crearCurso();
    curso.agregarModulo(Modulo.create('mod-1', 'Introducción', 1));
    curso.publicar();
    curso.pullDomainEvents(); // limpiar el evento de publicar()

    curso.despublicar();

    expect(curso.estado.value).toBe('borrador');
    expect(curso.pullDomainEvents()).toHaveLength(0);
  });

  it('despublicar() funciona incluso sin módulos (a diferencia de publicar())', () => {
    const curso = crearCurso();
    expect(() => curso.despublicar()).not.toThrow();
    expect(curso.estado.value).toBe('borrador');
  });
});
