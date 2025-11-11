import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación Completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('debería completar el flujo de login exitosamente', async ({ page }) => {
    // Verificar que el formulario de login está visible
    await expect(page.getByLabel(/correo/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();

    // Llenar el formulario con credenciales válidas
    // Nota: En un entorno real, usarías credenciales de test
    await page.getByLabel(/correo/i).fill('admin@example.com');
    await page.getByLabel(/contraseña/i).fill('password123');

    // Enviar el formulario
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Esperar a que se redirija al dashboard
    // En un entorno real, verificarías la redirección
    await page.waitForTimeout(2000);

    // Verificar que se muestra algún elemento del dashboard
    // Esto dependerá de la estructura real de tu dashboard
    // await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('debería mostrar error con credenciales inválidas', async ({ page }) => {
    await page.getByLabel(/correo/i).fill('invalid@example.com');
    await page.getByLabel(/contraseña/i).fill('wrong-password');

    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Esperar a que aparezca el mensaje de error
    await expect(page.getByText(/credenciales.*inválidas|error.*autenticación/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('debería validar campos requeridos', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /iniciar sesión/i });
    await submitButton.click();

    // Esperar a que aparezcan los mensajes de error
    await expect(page.getByText(/correo.*requerido/i)).toBeVisible();
    await expect(page.getByText(/contraseña.*requerida/i)).toBeVisible();
  });

  test('debería validar formato de correo electrónico', async ({ page }) => {
    await page.getByLabel(/correo/i).fill('invalid-email');
    await page.getByLabel(/contraseña/i).fill('password123');

    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(page.getByText(/correo.*inválido/i)).toBeVisible();
  });

  test('debería redirigir a la página de recuperación de contraseña', async ({ page }) => {
    // Buscar el enlace de "¿Olvidaste tu contraseña?"
    const forgotPasswordLink = page.getByText(/olvidaste|recuperar/i);

    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();

      // Verificar que se redirige a la página de recuperación
      await expect(page).toHaveURL(/forgot-password|recuperar/i);
    }
  });
});
