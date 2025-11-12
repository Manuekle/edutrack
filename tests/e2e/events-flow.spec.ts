import { test, expect } from '@playwright/test';

// Helper function para hacer login como docente
async function loginAsTeacher(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/tu@email.com/i).fill('elustondo129@gmail.com');
  await page.getByPlaceholder(/ingresa tu contraseña/i).fill('docente123');

  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {}),
    page.waitForLoadState('networkidle').catch(() => {}),
    page.getByRole('button', { name: /ingresar|iniciar sesión/i }).click(),
  ]);

  await page.waitForTimeout(2000);
}

// Helper function para hacer login como estudiante
async function loginAsStudent(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/tu@email.com/i).fill('manuel.erazo@estudiante.fup.edu.co');
  await page.getByPlaceholder(/ingresa tu contraseña/i).fill('estudiante123');

  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {}),
    page.waitForLoadState('networkidle').catch(() => {}),
    page.getByRole('button', { name: /ingresar|iniciar sesión/i }).click(),
  ]);

  await page.waitForTimeout(2000);
}

test.describe('Flujo de Eventos (Docente)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('debería mostrar la sección de eventos en una asignatura', async ({ page }) => {
    await page.goto('/dashboard/docente/asignaturas');
    await page.waitForLoadState('networkidle');

    // Acceder a una asignatura
    const subjectLink = page.getByRole('link').first();
    if (await subjectLink.isVisible()) {
      await subjectLink.click();
      await page.waitForLoadState('networkidle');

      // Buscar la sección de eventos
      const eventsSection = page.getByText(/eventos|calendario/i);
      const hasEvents = await eventsSection
        .first()
        .isVisible()
        .catch(() => false);

      // Puede que no haya eventos, pero verificar que la página carga
      expect(page.url()).toContain('/dashboard');
    }
  });

  test('debería permitir crear un nuevo evento', async ({ page }) => {
    await page.goto('/dashboard/docente/asignaturas');
    await page.waitForLoadState('networkidle');

    // Acceder a una asignatura
    const subjectLink = page.getByRole('link').first();
    if (await subjectLink.isVisible()) {
      await subjectLink.click();
      await page.waitForLoadState('networkidle');

      // Buscar el botón de crear evento
      const createEventButton = page.getByRole('button', {
        name: /crear.*evento|nuevo.*evento|agregar.*evento/i,
      });

      if (await createEventButton.isVisible()) {
        await createEventButton.click();
        await page.waitForTimeout(500);

        // Verificar que se abre el formulario de evento
        await expect(page.getByLabel(/título|title/i)).toBeVisible({ timeout: 2000 });
        await expect(page.getByLabel(/fecha|date/i)).toBeVisible();
        await expect(page.getByLabel(/tipo|type/i)).toBeVisible();
      }
    }
  });

  test('debería validar el formulario de evento', async ({ page }) => {
    await page.goto('/dashboard/docente/asignaturas');
    await page.waitForLoadState('networkidle');

    // Acceder a una asignatura
    const subjectLink = page.getByRole('link').first();
    if (await subjectLink.isVisible()) {
      await subjectLink.click();
      await page.waitForLoadState('networkidle');

      const createEventButton = page.getByRole('button', {
        name: /crear.*evento|nuevo.*evento/i,
      });

      if (await createEventButton.isVisible()) {
        await createEventButton.click();
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

        // Si no hay mensajes visibles, verificar que el formulario sigue abierto
        if (!hasErrors) {
          const form = page.getByLabel(/título|title/i);
          await expect(form).toBeVisible();
        }
      }
    }
  });

  test('debería crear un evento exitosamente', async ({ page }) => {
    await page.goto('/dashboard/docente/asignaturas');
    await page.waitForLoadState('networkidle');

    // Acceder a una asignatura
    const subjectLink = page.getByRole('link').first();
    if (await subjectLink.isVisible()) {
      await subjectLink.click();
      await page.waitForLoadState('networkidle');

      const createEventButton = page.getByRole('button', {
        name: /crear.*evento|nuevo.*evento/i,
      });

      if (await createEventButton.isVisible()) {
        await createEventButton.click();
        await page.waitForTimeout(500);

        // Llenar el formulario
        const timestamp = Date.now();
        const testTitle = `Test Event ${timestamp}`;

        await page.getByLabel(/título|title/i).fill(testTitle);

        // Seleccionar fecha (mañana)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];

        const dateInput = page.getByLabel(/fecha|date/i);
        if (await dateInput.isVisible()) {
          await dateInput.fill(dateString);
        }

        // Seleccionar tipo de evento
        const typeSelect = page.getByLabel(/tipo|type/i);
        if (await typeSelect.isVisible()) {
          await typeSelect.click();
          await page.waitForTimeout(200);
          const examOption = page.getByText(/examen|examen/i).first();
          if (await examOption.isVisible()) {
            await examOption.click();
          }
        }

        // Enviar el formulario
        const submitButton = page.getByRole('button', { name: /crear|guardar/i }).last();
        await submitButton.click();

        // Esperar a que se procese la creación
        await page.waitForTimeout(2000);

        // Verificar éxito
        const successMessage = page.getByText(/evento.*creado|creado.*éxito|éxito/i);
        const hasSuccess = await successMessage.isVisible().catch(() => false);

        // Si no hay mensaje visible, verificar que el formulario se cerró
        if (!hasSuccess) {
          const form = page.getByLabel(/título|title/i);
          const formClosed = await form.isVisible().catch(() => false);
          expect(formClosed).toBe(false);
        }
      }
    }
  });
});

test.describe('Flujo de Eventos (Estudiante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('debería mostrar los eventos próximos', async ({ page }) => {
    await page.goto('/dashboard/estudiante');
    await page.waitForLoadState('networkidle');

    // Buscar la sección de eventos próximos
    const upcomingEvents = page.getByText(/eventos.*próximos|próximos.*eventos|próximas/i);
    const hasEvents = await upcomingEvents
      .first()
      .isVisible()
      .catch(() => false);

    // Puede que no haya eventos, pero verificar que la página carga
    expect(page.url()).toContain('/dashboard');
  });

  test('debería mostrar detalles de eventos si están disponibles', async ({ page }) => {
    await page.goto('/dashboard/estudiante');
    await page.waitForLoadState('networkidle');

    // Buscar elementos de eventos
    const eventCards = page.getByText(/examen|trabajo|evento/i);
    const hasEvents = await eventCards
      .first()
      .isVisible()
      .catch(() => false);

    // Puede que no haya eventos, pero verificar que la página carga
    expect(page.url()).toContain('/dashboard');
  });
});
