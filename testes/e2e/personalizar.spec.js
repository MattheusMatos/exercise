// Loja: temas do app, títulos e comemoração do fim do treino.
const { test, expect, abrir, lerEstado, comecarTreino, terminarTreino, texto } = require('./ajuda');

const FOTOS = process.env.FOTOS_LOJA;
// 30 treinos = 300 pontos para gastar
const historico = Array.from({ length: 30 }, (_, k) => ({ data: `2026-10-${String(k + 1).padStart(2, '0')}`, treino: 'push_a' }));

test('tema comprado muda as cores do app e continua depois de recarregar', async ({ page }) => {
  await abrir(page, { quando: '2026-11-09T10:00:00', estado: { bloqueiosPresente: true, historico } });
  await page.click('.perfil .pontos');
  const saldo = async () => Number((await texto(page.locator('.saldo-loja'))).match(/\d+/)[0]);
  const antes = await saldo();
  const noite = page.locator('.opcao-loja:has-text("Noite")');
  await noite.locator('.comprar-item').click();
  await expect(noite).toHaveClass(/selecionada/);
  expect(await saldo()).toBe(antes - 80);
  const cor = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--laranja').trim());
  expect(await cor()).toBe('#5b8cff');
  if (FOTOS) await page.screenshot({ path: `${FOTOS}/l_temas.png` });
  await page.reload();
  expect(await cor()).toBe('#5b8cff');
  // voltar ao laranja é grátis, e o Noite continua comprado
  await page.click('.perfil .pontos');
  await page.locator('.opcao-loja:has-text("Laranja") .botao').click();
  expect(await cor()).toBe('#ff6b35');
  await expect(page.locator('.opcao-loja:has-text("Noite") .botao')).toHaveText('Usar');
});

test('títulos: conquista grátis e título comprado aparecem no perfil', async ({ page }) => {
  await abrir(page, { quando: '2026-11-09T10:00:00', estado: { bloqueiosPresente: true, historico } });
  await page.click('.perfil .pontos');
  await page.locator('.opcao-loja:has-text("Primeiro Passo") .botao').click();
  await expect(page.locator('.opcao-loja:has-text("Centenário") .bloqueado')).toBeVisible();
  await page.locator('.opcao-loja:has-text("Lenda do Supino") .comprar-item').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.titulo-usuario')).toHaveText('🏷️ Lenda do Supino');
  expect((await lerEstado(page)).compras.map((c) => c.tipo)).toContain('titulo:lenda-do-supino');
});

test('comemoração comprada aparece ao terminar o treino', async ({ page }) => {
  await abrir(page, { quando: '2026-11-09T10:00:00', estado: { bloqueiosPresente: true, historico } });
  await page.click('.perfil .pontos');
  await page.locator('.opcao-loja:has-text("Fogos") .comprar-item').click();
  await expect(page.locator('.comemoracao-fogos')).toBeAttached(); // mostra na hora, para ver como é
  if (FOTOS) { await page.waitForTimeout(700); await page.screenshot({ path: `${FOTOS}/l_fogos.png` }); }
  await page.keyboard.press('Escape');
  await comecarTreino(page);
  await terminarTreino(page);
  await expect(page.locator('.comemoracao-fogos')).toBeAttached();
  await expect(page.locator('.comemoracao')).toHaveCount(0, { timeout: 8000 });
});
