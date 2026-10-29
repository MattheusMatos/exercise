// Com o service worker ligado: o app tem de abrir e funcionar sem internet, como na academia.
const { test, expect, PERFIL } = require('./ajuda');

test.use({ serviceWorkers: 'allow' });

test('instala o service worker e abre o treino sem internet', async ({ page, context }) => {
  await context.addInitScript((perfil) => {
    if (!localStorage.getItem('ppl:estado')) localStorage.setItem('ppl:estado', JSON.stringify({ perfil }));
  }, PERFIL);
  await page.goto('./');
  await expect(page.locator('.hero')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  // espera o service worker guardar as fotos dos programas
  await expect.poll(() => page.evaluate(async () => {
    const c = await caches.open((await caches.keys())[0]);
    return (await c.keys()).some((r) => r.url.endsWith('fotos/Barbell_Full_Squat-1.jpg'));
  }), { timeout: 30_000 }).toBe(true);
  const manifesto = await page.evaluate(async () => {
    const m = await (await fetch('manifest.webmanifest')).json();
    return Promise.all(m.icons.map(async (i) => (await fetch(i.src)).status));
  });
  expect(manifesto.every((s) => s === 200)).toBe(true);

  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.hero')).toBeVisible();
  await page.getByText('Começar treino').click();
  await page.getByText('Pular o aquecimento de hoje').click();
  await expect(page.locator('.cartao.topo')).toBeVisible();
  await expect.poll(() => page.locator('.cartao.topo .pose-a').evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await page.click('.cartao.topo .trocar');
  await expect(page.locator('.biblioteca .item-bib').first()).toBeVisible();
  await context.setOffline(false);
});
