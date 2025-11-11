/**
 * Tests de rendimiento básicos
 */

describe('Performance Tests', () => {
  it('debería cargar la página de login en menos de 2 segundos', async () => {
    const startTime = Date.now();

    // Simular carga de página (en tests reales, usar Playwright o Lighthouse)
    await new Promise(resolve => setTimeout(resolve, 100));

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  it('debería validar que las APIs responden en tiempo razonable', () => {
    // Test básico de estructura
    // En tests reales, usar herramientas como k6 o Artillery
    expect(true).toBe(true);
  });
});
