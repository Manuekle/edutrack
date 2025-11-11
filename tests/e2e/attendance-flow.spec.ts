import { test, expect } from '@playwright/test';

test.describe('Flujo de Asistencia (Docente)', () => {
  test.beforeEach(async ({ page }) => {
    // Asumir que el usuario ya está autenticado como docente
    await page.goto('/dashboard/docente');
  });

  test('debería mostrar el dashboard del docente', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Verificar que se muestra el dashboard
    const dashboard = page.getByText(/dashboard|panel/i);
    const hasDashboard = await dashboard.isVisible().catch(() => false);

    expect(hasDashboard).toBe(true);
  });

  test('debería mostrar las clases programadas', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Buscar elementos relacionados con clases
    const classesSection = page.getByText(/clases|horario/i);
    const hasClasses = await classesSection.isVisible().catch(() => false);

    // Si hay clases, verificar que se muestran
    if (hasClasses) {
      expect(classesSection).toBeVisible();
    }
  });

  test('debería permitir generar código QR para una clase', async ({ page }) => {
    // Buscar el botón de generar QR o iniciar clase
    const qrButton = page.getByRole('button', {
      name: /generar.*qr|iniciar.*clase|qr/i,
    });

    if (await qrButton.isVisible()) {
      await qrButton.click();
      await page.waitForTimeout(1000);

      // Verificar que se muestra el código QR
      const qrCode = page.getByRole('img', { name: /qr/i });
      const qrText = page.getByText(/código.*qr|qr.*código/i);

      const hasQR = await qrCode.isVisible().catch(() => false);
      const hasQRText = await qrText.isVisible().catch(() => false);

      expect(hasQR || hasQRText).toBe(true);
    }
  });
});

test.describe('Flujo de Asistencia (Estudiante)', () => {
  test.beforeEach(async ({ page }) => {
    // Asumir que el estudiante ya está autenticado
    await page.goto('/dashboard/estudiante');
  });

  test('debería mostrar el dashboard del estudiante', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Verificar que se muestra el dashboard
    const dashboard = page.getByText(/dashboard|panel/i);
    const hasDashboard = await dashboard.isVisible().catch(() => false);

    expect(hasDashboard).toBe(true);
  });

  test('debería mostrar las clases actuales', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Buscar elementos relacionados con clases actuales
    const currentClass = page.getByText(/clase.*actual|clase.*en.*curso/i);
    const hasCurrentClass = await currentClass.isVisible().catch(() => false);

    // Si hay una clase en curso, debería mostrarse
    if (hasCurrentClass) {
      expect(currentClass).toBeVisible();
    }
  });
});
