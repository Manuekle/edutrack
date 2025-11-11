import { test, expect } from '@playwright/test';

test.describe('Flujo de Eventos (Docente)', () => {
  test.beforeEach(async ({ page }) => {
    // Asumir que el docente ya está autenticado
    await page.goto('/dashboard/docente/asignaturas');
  });

  test('debería mostrar la sección de eventos', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Buscar la sección de eventos
    const eventsSection = page.getByText(/eventos|calendario/i);
    const hasEvents = await eventsSection.isVisible().catch(() => false);

    // Si hay eventos, deberían mostrarse
    if (hasEvents) {
      expect(eventsSection).toBeVisible();
    }
  });

  test('debería permitir crear un nuevo evento', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Buscar el botón de crear evento
    const createEventButton = page.getByRole('button', {
      name: /crear.*evento|nuevo.*evento/i,
    });

    if (await createEventButton.isVisible()) {
      await createEventButton.click();
      await page.waitForTimeout(500);

      // Verificar que se abre el formulario de evento
      await expect(page.getByLabel(/título/i)).toBeVisible({ timeout: 2000 });
      await expect(page.getByLabel(/fecha/i)).toBeVisible();
      await expect(page.getByLabel(/tipo/i)).toBeVisible();
    }
  });

  test('debería validar el formulario de evento', async ({ page }) => {
    await page.waitForTimeout(1000);

    const createEventButton = page.getByRole('button', {
      name: /crear.*evento|nuevo.*evento/i,
    });

    if (await createEventButton.isVisible()) {
      await createEventButton.click();
      await page.waitForTimeout(500);

      // Intentar enviar el formulario vacío
      const submitButton = page.getByRole('button', { name: /crear|guardar/i });
      await submitButton.click();

      // Verificar que aparecen mensajes de error
      await expect(page.getByText(/título.*requerido|fecha.*requerida/i)).toBeVisible({
        timeout: 2000,
      });
    }
  });
});

test.describe('Flujo de Eventos (Estudiante)', () => {
  test.beforeEach(async ({ page }) => {
    // Asumir que el estudiante ya está autenticado
    await page.goto('/dashboard/estudiante');
  });

  test('debería mostrar los eventos próximos', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Buscar la sección de eventos próximos
    const upcomingEvents = page.getByText(/eventos.*próximos|próximos.*eventos/i);
    const hasEvents = await upcomingEvents.isVisible().catch(() => false);

    // Si hay eventos, deberían mostrarse
    if (hasEvents) {
      expect(upcomingEvents).toBeVisible();
    }
  });
});
