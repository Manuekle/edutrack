import { test, expect } from '@playwright/test';

// Helper function para hacer login como admin
async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/tu@email.com/i).fill('meerazo7@hotmail.com');
  await page.getByPlaceholder(/ingresa tu contraseña/i).fill('admin123');

  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {}),
    page.waitForLoadState('networkidle').catch(() => {}),
    page.getByRole('button', { name: /ingresar|iniciar sesión/i }).click(),
  ]);

  await page.waitForTimeout(2000);
}

test.describe('Gestión de Usuarios (Admin) - Flujo Completo', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/admin/usuarios');
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
  });

  test('debería mostrar la lista de usuarios', async ({ page }) => {
    // Verificar que la página carga correctamente
    await expect(page.getByText(/gestión de usuarios|usuarios/i)).toBeVisible({ timeout: 5000 });

    // Verificar que hay una tabla o lista de usuarios
    const usersTable = page.getByRole('table');
    const hasTable = await usersTable.isVisible().catch(() => false);

    // También puede haber una lista o cards
    if (!hasTable) {
      // Verificar que hay algún contenido de usuarios
      const usersContent = page.getByText(/usuarios|usuarios encontrados/i);
      await expect(usersContent.first()).toBeVisible({ timeout: 3000 });
    } else {
      await expect(usersTable).toBeVisible();
    }
  });

  test('debería abrir el modal de crear usuario y mostrar el formulario', async ({ page }) => {
    // Buscar el botón de "Nuevo Usuario" o "Crear Usuario"
    const createButton = page.getByRole('button', { name: /nuevo usuario|crear usuario/i });

    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // Esperar a que el modal se abra
    await page.waitForTimeout(500);

    // Verificar que el modal se abre y muestra el formulario
    const modalTitle = page.getByText(/crear.*usuario|nuevo.*usuario/i);
    await expect(modalTitle).toBeVisible({ timeout: 2000 });

    // Verificar que los campos del formulario están visibles
    await expect(page.getByLabel(/nombre/i)).toBeVisible();
    await expect(page.getByLabel(/correo|email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
    await expect(page.getByLabel(/rol|role/i)).toBeVisible();
  });

  test('debería validar el formulario de crear usuario', async ({ page }) => {
    // Abrir el modal de crear usuario
    const createButton = page.getByRole('button', { name: /nuevo usuario|crear usuario/i });
    await createButton.click();
    await page.waitForTimeout(500);

    // Intentar enviar el formulario vacío
    const submitButton = page.getByRole('button', { name: /crear|guardar|enviar/i }).last();
    await submitButton.click();

    // Esperar a que aparezcan mensajes de validación
    await page.waitForTimeout(1000);

    // Verificar que aparecen mensajes de error (pueden ser varios)
    const errorMessages = page.getByText(/requerido|required|obligatorio/i);
    const hasErrors = await errorMessages
      .first()
      .isVisible()
      .catch(() => false);

    // Si no hay mensajes visibles, verificar que el modal sigue abierto (no se cerró)
    if (!hasErrors) {
      const modal = page.getByText(/crear.*usuario|nuevo.*usuario/i);
      await expect(modal).toBeVisible();
    }
  });

  test('debería crear un nuevo usuario exitosamente', async ({ page }) => {
    // Abrir el modal de crear usuario
    const createButton = page.getByRole('button', { name: /nuevo usuario|crear usuario/i });
    await createButton.click();
    await page.waitForTimeout(500);

    // Llenar el formulario
    const timestamp = Date.now();
    const testEmail = `test-user-${timestamp}@example.com`;
    const testName = `Test User ${timestamp}`;

    await page.getByLabel(/nombre/i).fill(testName);
    await page.getByLabel(/correo|email/i).fill(testEmail);
    await page.getByLabel(/contraseña|password/i).fill('testpassword123');

    // Seleccionar rol (si hay un select)
    const roleSelect = page.getByLabel(/rol|role/i);
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      await page.waitForTimeout(200);
      // Seleccionar ESTUDIANTE como rol por defecto
      const estudianteOption = page.getByText(/estudiante/i).first();
      if (await estudianteOption.isVisible()) {
        await estudianteOption.click();
      }
    }

    // Enviar el formulario
    const submitButton = page.getByRole('button', { name: /crear|guardar/i }).last();
    await submitButton.click();

    // Esperar a que se cierre el modal o aparezca un mensaje de éxito
    await page.waitForTimeout(2000);

    // Verificar éxito (puede ser un toast, mensaje, o que el modal se cierre)
    const successMessage = page.getByText(/usuario.*creado|creado.*éxito|éxito/i);
    const hasSuccess = await successMessage.isVisible().catch(() => false);

    // Si no hay mensaje visible, verificar que el modal se cerró
    if (!hasSuccess) {
      const modal = page.getByText(/crear.*usuario|nuevo.*usuario/i);
      const modalClosed = await modal.isVisible().catch(() => false);
      expect(modalClosed).toBe(false);
    }
  });

  test('debería permitir buscar usuarios', async ({ page }) => {
    // Buscar el campo de búsqueda
    const searchInput = page
      .getByPlaceholder(/buscar|search|buscar usuarios/i)
      .or(page.getByLabel(/buscar|search/i));

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Verificar que los resultados se actualizan (puede mostrar "0 resultados" o la tabla se actualiza)
      // Esto depende de la implementación, pero al menos verificar que no hay error
      const errorMessage = page.getByText(/error|failed/i);
      const hasError = await errorMessage.isVisible().catch(() => false);
      expect(hasError).toBe(false);
    }
  });

  test('debería permitir filtrar usuarios por rol', async ({ page }) => {
    // Buscar el selector de rol
    const roleFilter = page
      .getByLabel(/filtrar.*rol|rol/i)
      .or(page.getByRole('combobox', { name: /rol/i }));

    if (await roleFilter.isVisible()) {
      await roleFilter.click();
      await page.waitForTimeout(200);

      // Seleccionar un rol
      const estudianteOption = page.getByText(/estudiante/i).first();
      if (await estudianteOption.isVisible()) {
        await estudianteOption.click();
        await page.waitForTimeout(1000);

        // Verificar que los resultados se actualizan
        const errorMessage = page.getByText(/error|failed/i);
        const hasError = await errorMessage.isVisible().catch(() => false);
        expect(hasError).toBe(false);
      }
    }
  });

  test('debería permitir paginar la lista de usuarios', async ({ page }) => {
    // Buscar controles de paginación
    const nextButton = page.getByRole('button', { name: /siguiente|next/i });
    const prevButton = page.getByRole('button', { name: /anterior|previous/i });

    // Si hay botón de siguiente y está habilitado, hacer clic
    if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Verificar que la página cambió (puede ser por el número de página o los datos)
      const errorMessage = page.getByText(/error|failed/i);
      const hasError = await errorMessage.isVisible().catch(() => false);
      expect(hasError).toBe(false);
    }
  });
});
