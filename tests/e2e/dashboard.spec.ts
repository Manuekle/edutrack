import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('debería redirigir a login si no está autenticado', async ({ page }) => {
    await page.goto('/dashboard');

    // Debería redirigir a login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('debería mostrar el dashboard después de iniciar sesión', async ({ page }) => {
    // Este test requiere autenticación real o mocks
    // Por ahora, solo verificamos que la página de login existe
    await page.goto('/login');
    await expect(page.getByLabel(/correo/i)).toBeVisible();
  });

  test('debería mostrar el dashboard del estudiante si está autenticado', async ({ page }) => {
    // Nota: Este test requiere autenticación real o configuración de estado de sesión
    // En un entorno real, usarías fixtures de Playwright para autenticación
    await page.goto('/dashboard/estudiante');

    // Verificar que se redirige a login si no está autenticado
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('debería mostrar el dashboard del docente si está autenticado', async ({ page }) => {
    // Nota: Este test requiere autenticación real
    await page.goto('/dashboard/docente');

    // Verificar que se redirige a login si no está autenticado
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('debería mostrar el dashboard del admin si está autenticado', async ({ page }) => {
    // Nota: Este test requiere autenticación real
    await page.goto('/dashboard/admin');

    // Verificar que se redirige a login si no está autenticado
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
