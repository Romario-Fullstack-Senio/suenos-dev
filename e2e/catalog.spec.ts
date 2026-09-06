import { test, expect } from './fixtures';

test.describe('Catálogo de cursos', () => {
  test('lista cursos y permite entrar al detalle de uno', async ({ page }) => {
    await page.goto('/cursos');
    await expect(page.getByRole('heading', { name: 'Cursos Disponibles' })).toBeVisible();

    // Un link a /cursos/<slug> (no a /cursos ni /cursos/algo/mas) — cada
    // card de curso en el catálogo enlaza así (ver CursoCard).
    const primerCurso = page.locator('a[href^="/cursos/"]').first();
    await expect(primerCurso).toBeVisible();
    const titulo = await primerCurso.innerText();

    await primerCurso.click();
    await expect(page).toHaveURL(/\/cursos\/[^/]+$/);
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
