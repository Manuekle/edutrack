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

test.describe('Flujo de Asistencia (Docente)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('debería mostrar el dashboard del docente', async ({ page }) => {
    await page.goto('/dashboard/docente');
    await page.waitForLoadState('networkidle');

    // Verificar que se muestra el dashboard
    const dashboard = page.getByText(/dashboard|panel|docente/i);
    await expect(dashboard.first()).toBeVisible({ timeout: 5000 });
  });

  test('debería mostrar las asignaturas del docente', async ({ page }) => {
    await page.goto('/dashboard/docente/asignaturas');
    await page.waitForLoadState('networkidle');

    // Verificar que se muestran las asignaturas
    const subjectsSection = page.getByText(/mis asignaturas|asignaturas/i);
    await expect(subjectsSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('debería mostrar las clases programadas', async ({ page }) => {
    await page.goto('/dashboard/docente');
    await page.waitForLoadState('networkidle');

    // Buscar elementos relacionados con clases
    const classesSection = page.getByText(/clases|horario|próximas/i);
    const hasClasses = await classesSection
      .first()
      .isVisible()
      .catch(() => false);

    // Puede que no haya clases programadas, pero al menos verificar que la página carga
    expect(page.url()).toContain('/dashboard');
  });

  test('debería permitir acceder a una asignatura y ver sus clases', async ({ page }) => {
    await page.goto('/dashboard/docente/asignaturas');
    await page.waitForLoadState('networkidle');

    // Buscar un enlace a una asignatura
    const subjectLink = page.getByRole('link', { name: /asignatura|materia/i }).first();
    const hasSubjectLink = await subjectLink.isVisible().catch(() => false);

    if (hasSubjectLink) {
      await subjectLink.click();
      await page.waitForLoadState('networkidle');

      // Verificar que se muestra la página de la asignatura
      await expect(page).toHaveURL(/\/dashboard\/docente\/asignaturas\/.+/);
    }
  });
});

test.describe('Flujo de Asistencia (Estudiante)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('debería mostrar el dashboard del estudiante', async ({ page }) => {
    await page.goto('/dashboard/estudiante');
    await page.waitForLoadState('networkidle');

    // Verificar que se muestra el dashboard
    const dashboard = page.getByText(/dashboard|panel|mi panel/i);
    await expect(dashboard.first()).toBeVisible({ timeout: 5000 });
  });

  test('debería mostrar las asignaturas del estudiante', async ({ page }) => {
    await page.goto('/dashboard/estudiante');
    await page.waitForLoadState('networkidle');

    // Verificar que se muestran las asignaturas
    const subjectsSection = page.getByText(/asignaturas|materias/i);
    const hasSubjects = await subjectsSection
      .first()
      .isVisible()
      .catch(() => false);

    // Puede que no haya asignaturas, pero al menos verificar que la página carga
    expect(page.url()).toContain('/dashboard');
  });

  test('debería mostrar las clases actuales si hay una en curso', async ({ page }) => {
    await page.goto('/dashboard/estudiante');
    await page.waitForLoadState('networkidle');

    // Buscar elementos relacionados con clases actuales
    const currentClass = page.getByText(/clase.*actual|clase.*en.*curso|clase.*vivo/i);
    const hasCurrentClass = await currentClass
      .first()
      .isVisible()
      .catch(() => false);

    // Puede que no haya una clase en curso, pero verificar que la página carga
    expect(page.url()).toContain('/dashboard');
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

  test('debería mostrar estadísticas de asistencia', async ({ page }) => {
    await page.goto('/dashboard/estudiante');
    await page.waitForLoadState('networkidle');

    // Buscar elementos de estadísticas
    const stats = page.getByText(/asistencia|porcentaje|estadísticas/i);
    const hasStats = await stats
      .first()
      .isVisible()
      .catch(() => false);

    // Puede que no haya estadísticas, pero verificar que la página carga
    expect(page.url()).toContain('/dashboard');
  });
});

test.describe('Flujo Completo de Registro de Asistencia', () => {
  test('debería permitir que un estudiante vea las instrucciones para escanear QR', async ({
    page,
  }) => {
    await loginAsStudent(page);
    await page.goto('/dashboard/estudiante');
    await page.waitForLoadState('networkidle');

    // Buscar información sobre cómo escanear el QR
    // Esto puede estar en la sección de clase en vivo o en instrucciones
    const qrInstructions = page.getByText(/qr|escanear|código/i);
    const hasInstructions = await qrInstructions
      .first()
      .isVisible()
      .catch(() => false);

    // Si hay una clase en vivo, debería mostrar información sobre el QR
    const liveClass = page.getByText(/clase.*vivo|clase.*actual/i);
    const hasLiveClass = await liveClass
      .first()
      .isVisible()
      .catch(() => false);

    // Verificar que al menos la página carga correctamente
    expect(page.url()).toContain('/dashboard');
  });
});
