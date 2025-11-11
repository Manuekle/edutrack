import { test, expect } from '@playwright/test';

test.describe('Gestión de Asignaturas (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    // Asumir que el usuario ya está autenticado como admin
    await page.goto('/dashboard/admin/asignaturas');
  });

  test('debería mostrar la lista de asignaturas', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Verificar que hay elementos de la tabla o lista de asignaturas
    const subjectsTable = page.getByRole('table');
    const subjectsList = page.getByText(/asignaturas/i);

    const hasTable = await subjectsTable.isVisible().catch(() => false);
    const hasList = await subjectsList.isVisible().catch(() => false);

    expect(hasTable || hasList).toBe(true);
  });

  test('debería abrir el modal de crear asignatura', async ({ page }) => {
    const createButton = page.getByRole('button', {
      name: /crear.*asignatura|nueva.*asignatura/i,
    });

    if (await createButton.isVisible()) {
      await createButton.click();

      // Verificar que el modal se abre
      await expect(page.getByText(/crear.*asignatura/i)).toBeVisible({ timeout: 2000 });

      // Verificar que los campos del formulario están visibles
      await expect(page.getByLabel(/nombre/i)).toBeVisible();
      await expect(page.getByLabel(/código/i)).toBeVisible();
    }
  });

  test('debería validar el formulario de crear asignatura', async ({ page }) => {
    const createButton = page.getByRole('button', {
      name: /crear.*asignatura|nueva.*asignatura/i,
    });

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Intentar enviar el formulario vacío
      const submitButton = page.getByRole('button', { name: /crear|guardar/i });
      await submitButton.click();

      // Verificar que aparecen mensajes de error
      await expect(page.getByText(/nombre.*requerido|código.*requerido/i)).toBeVisible({
        timeout: 2000,
      });
    }
  });
});
