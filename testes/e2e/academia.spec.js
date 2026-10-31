// Versão de academia (academias/feira-fitness): mesmo app, com logo e cores próprios e dados numa
// chave separada. O mais importante aqui: não pode encostar nos dados do Treino PPL.
const { test, expect, PERFIL } = require('./ajuda');

const PPL = { perfil: PERFIL, historico: [{ data: '2026-10-26', treino: 'push_a' }], versao: 1 };

test('Feira Fitness: primeira abertura com o logo, dados separados e sem service worker', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T18:00:00-03:00') });
  await page.goto('./');
  await page.evaluate((e) => { localStorage.clear(); localStorage.setItem('ppl:estado', JSON.stringify(e)); }, PPL);
  const antes = await page.evaluate(() => localStorage.getItem('ppl:estado'));

  await page.goto('../academias/feira-fitness/');
  await expect(page).toHaveTitle('Feira Fitness');
  // primeira vez na academia, mesmo com o Treino PPL já usado neste aparelho
  await expect(page.locator('.boas-vindas')).toBeVisible();
  await page.fill('.campo-nome', 'Ana');
  await page.press('.campo-nome', 'Enter');
  await page.click('.opcao-sexo:has-text("Mulher")');
  await page.click('.botao.fixo');
  await page.click('[data-programa="iniciante_f"]');
  await expect(page.locator('.marca-academia img')).toBeVisible();
  expect(await page.locator('.marca-academia img').evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.hero')).toBeVisible();

  const chaves = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(chaves).toEqual(['feira-fitness:estado', 'ppl:estado']);
  expect(await page.evaluate(() => localStorage.getItem('ppl:estado'))).toBe(antes);
  const academia = await page.evaluate(() => JSON.parse(localStorage.getItem('feira-fitness:estado')));
  expect(academia.perfil).toMatchObject({ nome: 'Ana', programa: 'iniciante_f' });
  expect(academia.estiloCard).toBe('academia');
  expect(await page.evaluate(async () => (navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : 0))).toBe(0);

  // e o Treino PPL continua com os dados dele
  await page.goto('./');
  await expect(page.locator('.marca h1')).toBeVisible();
  await expect(page.locator('.saudacao')).toContainText('Matheus');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ppl:estado')).historico)).toEqual(PPL.historico);
});

test('Feira Fitness: card do treino nas cores da academia, com o nome dela', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T18:00:00-03:00') });
  await page.goto('../academias/feira-fitness/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('feira-fitness:estado', JSON.stringify({ perfil: { personagem: 'bia', programa: 'iniciante_f', sexo: 'f', nome: 'Ana', configurado: true } }));
  });
  await page.reload();
  await page.getByText('Começar treino').click();
  await page.getByText('Pular o aquecimento de hoje').click();
  for (let i = 0; i < 40 && (await page.locator('.cartao.topo').count()); i++) {
    if (await page.locator('.descanso.cheio').count()) await page.click('.descanso .pular');
    await page.click('.acao.feito');
    await page.waitForTimeout(300);
  }
  await page.click('.compartilhar');
  await expect(page.locator('.card-previa')).toBeVisible();
  await expect(page.locator('.opcoes-estilo button').first()).toContainText('Feira Fitness');
  await expect(page.locator('.opcoes-estilo button').first()).toHaveAttribute('aria-pressed', 'true');
});
