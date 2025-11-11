import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('debería mostrar el formulario de login', async ({ page }) => {
    await expect(page.getByLabel(/correo/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('debería validar campos requeridos', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /iniciar sesión/i });
    await submitButton.click();

    // Esperar a que aparezcan los mensajes de error
    await expect(page.getByText(/correo.*requerido/i)).toBeVisible();
    await expect(page.getByText(/contraseña.*requerida/i)).toBeVisible();
  });

  test('debería validar formato de correo electrónico', async ({ page }) => {
    const emailInput = page.getByLabel(/correo/i);
    await emailInput.fill('invalid-email');

    const submitButton = page.getByRole('button', { name: /iniciar sesión/i });
    await submitButton.click();

    await expect(page.getByText(/correo.*inválido/i)).toBeVisible();
  });

  test('debería mostrar error con credenciales inválidas', async ({ page }) => {
    const emailInput = page.getByLabel(/correo/i);
    const passwordInput = page.getByLabel(/contraseña/i);

    await emailInput.fill('test@example.com');
    await passwordInput.fill('wrong-password');

    const submitButton = page.getByRole('button', { name: /iniciar sesión/i });
    await submitButton.click();

    // Esperar a que aparezca el mensaje de error
    await expect(page.getByText(/credenciales.*inválidas/i)).toBeVisible({ timeout: 5000 });
  });
});
