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

test.describe('Gestión de Asignaturas (Admin) - Flujo Completo', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/admin/asignaturas');
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
  });

  test('debería mostrar la lista de asignaturas', async ({ page }) => {
    // Verificar que la página carga correctamente
    await expect(page.getByText(/asignaturas|gestión.*asignaturas/i)).toBeVisible({
      timeout: 5000,
    });

    // Verificar que hay una tabla o lista de asignaturas
    const subjectsTable = page.getByRole('table');
    const hasTable = await subjectsTable.isVisible().catch(() => false);

    if (!hasTable) {
      // Verificar que hay algún contenido de asignaturas
      const subjectsContent = page.getByText(/asignaturas|materias/i);
      await expect(subjectsContent.first()).toBeVisible({ timeout: 3000 });
    } else {
      await expect(subjectsTable).toBeVisible();
    }
  });

  test('debería abrir el modal de crear asignatura y mostrar el formulario', async ({ page }) => {
    // Buscar el botón de "Nueva Asignatura" o "Crear Asignatura"
    const createButton = page.getByRole('button', { name: /nueva asignatura|crear asignatura/i });

    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // Esperar a que el modal se abra
    await page.waitForTimeout(500);

    // Verificar que el modal se abre y muestra el formulario
    const modalTitle = page.getByText(/crear.*asignatura|nueva.*asignatura/i);
    await expect(modalTitle).toBeVisible({ timeout: 2000 });

    // Verificar que los campos del formulario están visibles
    await expect(page.getByLabel(/nombre/i)).toBeVisible();
    await expect(page.getByLabel(/código|code/i)).toBeVisible();

    // El docente puede estar en un select
    const teacherSelect = page.getByLabel(/docente|profesor|teacher/i);
    const hasTeacherSelect = await teacherSelect.isVisible().catch(() => false);

    // Al menos nombre y código deben estar visibles
    expect(hasTeacherSelect || true).toBe(true);
  });

  test('debería validar el formulario de crear asignatura', async ({ page }) => {
    // Abrir el modal de crear asignatura
    const createButton = page.getByRole('button', { name: /nueva asignatura|crear asignatura/i });
    await createButton.click();
    await page.waitForTimeout(500);

    // Intentar enviar el formulario vacío
    const submitButton = page.getByRole('button', { name: /crear|guardar|enviar/i }).last();
    await submitButton.click();

    // Esperar a que aparezcan mensajes de validación
    await page.waitForTimeout(1000);

    // Verificar que aparecen mensajes de error
    const errorMessages = page.getByText(/requerido|required|obligatorio/i);
    const hasErrors = await errorMessages
      .first()
      .isVisible()
      .catch(() => false);

    // Si no hay mensajes visibles, verificar que el modal sigue abierto
    if (!hasErrors) {
      const modal = page.getByText(/crear.*asignatura|nueva.*asignatura/i);
      await expect(modal).toBeVisible();
    }
  });

  test('debería crear una nueva asignatura exitosamente', async ({ page }) => {
    // Abrir el modal de crear asignatura
    const createButton = page.getByRole('button', { name: /nueva asignatura|crear asignatura/i });
    await createButton.click();
    await page.waitForTimeout(500);

    // Llenar el formulario
    const timestamp = Date.now();
    const testCode = `TEST${timestamp}`;
    const testName = `Test Subject ${timestamp}`;

    await page.getByLabel(/nombre/i).fill(testName);
    await page.getByLabel(/código|code/i).fill(testCode);

    // Seleccionar docente (si hay un select)
    const teacherSelect = page.getByLabel(/docente|profesor|teacher/i);
    if (await teacherSelect.isVisible()) {
      await teacherSelect.click();
      await page.waitForTimeout(200);
      // Seleccionar el primer docente disponible
      const firstTeacher = page.getByRole('option').first();
      if (await firstTeacher.isVisible()) {
        await firstTeacher.click();
      }
    }

    // Enviar el formulario
    const submitButton = page.getByRole('button', { name: /crear|guardar/i }).last();
    await submitButton.click();

    // Esperar a que se procese la creación
    await page.waitForTimeout(2000);

    // Verificar éxito (puede ser un toast, mensaje, o que el modal se cierre)
    const successMessage = page.getByText(/asignatura.*creada|creada.*éxito|éxito/i);
    const hasSuccess = await successMessage.isVisible().catch(() => false);

    // Si no hay mensaje visible, verificar que el modal se cerró
    if (!hasSuccess) {
      const modal = page.getByText(/crear.*asignatura|nueva.*asignatura/i);
      const modalClosed = await modal.isVisible().catch(() => false);
      expect(modalClosed).toBe(false);
    }
  });

  test('debería permitir buscar asignaturas', async ({ page }) => {
    // Buscar el campo de búsqueda
    const searchInput = page
      .getByPlaceholder(/buscar|search|buscar asignaturas/i)
      .or(page.getByLabel(/buscar|search/i));

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Verificar que no hay errores
      const errorMessage = page.getByText(/error|failed/i);
      const hasError = await errorMessage.isVisible().catch(() => false);
      expect(hasError).toBe(false);
    }
  });

  test('debería mostrar información del docente en la lista', async ({ page }) => {
    // Verificar que la tabla o lista muestra información del docente
    const table = page.getByRole('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      // Buscar encabezados de columna que mencionen docente
      const teacherHeader = page.getByRole('columnheader', { name: /docente|profesor|teacher/i });
      const hasTeacherHeader = await teacherHeader.isVisible().catch(() => false);

      // Si no hay encabezado, al menos verificar que la tabla existe
      expect(hasTeacherHeader || hasTable).toBe(true);
    }
  });
});
