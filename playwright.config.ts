import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Ejecutar tests en archivos en paralelo */
  fullyParallel: true,
  /* Fallar el build en CI si accidentalmente dejaste test.only en el código fuente */
  forbidOnly: !!process.env.CI,
  /* Reintentar en CI solo */
  retries: process.env.CI ? 2 : 0,
  /* Optar por ejecutar en paralelo en CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter a usar. Ver https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Configuraciones compartidas para todos los proyectos. Ver https://playwright.dev/docs/api/class-testoptions */
  use: {
    /* URL base para usar en acciones como `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    /* Recolectar trace cuando se reintenta el test fallido. Ver https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Captura de pantalla cuando falla un test */
    screenshot: 'only-on-failure',
  },

  /* Configurar proyectos para navegadores principales */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Ejecutar el servidor de desarrollo local antes de iniciar los tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
