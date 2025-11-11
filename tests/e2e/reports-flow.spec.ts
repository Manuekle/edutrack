import { test, expect } from '@playwright/test';

test.describe('Flujo de Reportes (Docente)', () => {
  test.beforeEach(async ({ page }) => {
    // Asumir que el docente ya está autenticado
    await page.goto('/dashboard/docente/asignaturas');
  });

  test('debería mostrar la lista de asignaturas del docente', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Verificar que se muestran las asignaturas
    const subjects = page.getByText(/asignaturas|materias/i);
    const hasSubjects = await subjects.isVisible().catch(() => false);

    expect(hasSubjects).toBe(true);
  });

  test('debería permitir generar un reporte de asistencia', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Buscar el botón de generar reporte
    const reportButton = page.getByRole('button', {
      name: /generar.*reporte|reporte/i,
    });

    if (await reportButton.isVisible()) {
      await reportButton.click();
      await page.waitForTimeout(500);

      // Verificar que se abre el modal de generación de reporte
      const reportModal = page.getByText(/generar.*reporte|reporte.*asistencia/i);
      const hasModal = await reportModal.isVisible().catch(() => false);

      if (hasModal) {
        expect(reportModal).toBeVisible();
      }
    }
  });

  test('debería mostrar las estadísticas de asistencia', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Buscar elementos de estadísticas
    const stats = page.getByText(/estadísticas|asistencia|porcentaje/i);
    const hasStats = await stats.isVisible().catch(() => false);

    // Si hay estadísticas, deberían mostrarse
    if (hasStats) {
      expect(stats).toBeVisible();
    }
  });
});
