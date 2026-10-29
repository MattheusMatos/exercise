// Testes de tela: abrem o app num Chromium com tela de celular, servido por um servidor local.
const { defineConfig } = require('@playwright/test');

const PORTA = 4173;

module.exports = defineConfig({
  testDir: 'testes/e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORTA}/treinos/`,
    browserName: 'chromium',
    viewport: { width: 390, height: 820 },
    hasTouch: true,
    timezoneId: 'America/Sao_Paulo',
    locale: 'pt-BR',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `python3 -m http.server ${PORTA}`,
    url: `http://localhost:${PORTA}/treinos/`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
