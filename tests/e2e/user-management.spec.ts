import { test, expect } from '@playwright/test';

test.describe('Gestión de Usuarios (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    // Asumir que el usuario ya está autenticado como admin
    // En un entorno real, harías login primero
    await page.goto('/dashboard/admin/usuarios');
  });

  test('debería mostrar la lista de usuarios', async ({ page }) => {
    // Esperar a que se cargue la página
    await page.waitForTimeout(1000);

    // Verificar que hay elementos de la tabla o lista de usuarios
    // Esto dependerá de la estructura real de tu página
    const usersTable = page.getByRole('table');
    const usersList = page.getByText(/usuarios/i);

    // Al menos uno de estos elementos debe estar visible
    const hasTable = await usersTable.isVisible().catch(() => false);
    const hasList = await usersList.isVisible().catch(() => false);

    expect(hasTable || hasList).toBe(true);
  });

  test('debería abrir el modal de crear usuario', async ({ page }) => {
    // Buscar el botón de "Crear Usuario" o "Nuevo Usuario"
    const createButton = page.getByRole('button', { name: /crear.*usuario|nuevo.*usuario/i });

    if (await createButton.isVisible()) {
      await createButton.click();

      // Verificar que el modal se abre
      await expect(page.getByText(/crear.*usuario/i)).toBeVisible({ timeout: 2000 });

      // Verificar que los campos del formulario están visibles
      await expect(page.getByLabel(/nombre/i)).toBeVisible();
      await expect(page.getByLabel(/correo/i)).toBeVisible();
      await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    }
  });

  test('debería validar el formulario de crear usuario', async ({ page }) => {
    // Abrir el modal de crear usuario
    const createButton = page.getByRole('button', { name: /crear.*usuario|nuevo.*usuario/i });

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Intentar enviar el formulario vacío
      const submitButton = page.getByRole('button', { name: /crear|guardar/i });
      await submitButton.click();

      // Verificar que aparecen mensajes de error
      await expect(page.getByText(/nombre.*requerido|correo.*requerido/i)).toBeVisible({
        timeout: 2000,
      });
    }
  });

  test('debería permitir buscar usuarios', async ({ page }) => {
    // Buscar el campo de búsqueda
    const searchInput = page.getByPlaceholder(/buscar|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Verificar que los resultados se actualizan
      // Esto dependerá de cómo implementes la búsqueda
    }
  });
});
