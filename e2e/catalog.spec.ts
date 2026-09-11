import { test, expect } from './fixtures';

test.describe('Catálogo de cursos', () => {
  test('lista cursos y permite entrar al detalle de uno', async ({ page }) => {
    await page.goto('/cursos');
    await expect(page.getByRole('heading', { name: 'Cursos Disponibles' })).toBeVisible();

    // Esperar el contador de resultados ANTES de tocar nada: el listado se
    // pinta después del fetch y, si se hace click mientras todavía está
    // re-renderizando, el click cae en un nodo ya reemplazado y la
    // navegación nunca ocurre (test flaky: quedaba en /cursos).
    await expect(page.getByText(/\d+ cursos? encontrados?/i)).toBeVisible({ timeout: 15_000 });

    // Un link a /cursos/<slug> (no a /cursos ni /cursos/algo/mas) — cada
    // card de curso en el catálogo enlaza así (ver CursoCard).
    const primerCurso = page.locator('a[href^="/cursos/"]').first();
    await expect(primerCurso).toBeVisible();
    const titulo = await primerCurso.innerText();
    const href = await primerCurso.getAttribute('href');

    // waitForURL con el href real en vez de un toHaveURL genérico: si el
    // click se pierde, falla diciendo que no navegó, no que "la URL no
    // matchea el patrón".
    await primerCurso.click();
    await page.waitForURL(`**${href}`, { timeout: 15_000 });
    // El título del curso listado también aparece en su página de detalle.
    await expect(page.getByText(titulo.split('\n')[0], { exact: false }).first()).toBeVisible();
  });

  test('buscar filtra los resultados', async ({ page }) => {
    await page.goto('/cursos');
    const buscador = page.getByPlaceholder(/Buscar cursos/i);
    await expect(buscador).toBeVisible();
    await buscador.fill('zzzzz-curso-que-no-existe-zzzzz');
    // Sin resultados debería decirlo explícitamente, no dejar el spinner
    // colgado ni mostrar cards viejas.
    await expect(page.getByText(/no se encontraron|0 cursos/i)).toBeVisible({ timeout: 10_000 });
  });
});
