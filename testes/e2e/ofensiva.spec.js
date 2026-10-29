const { test, expect, abrir, lerEstado, texto, SEG_QUA_SEX } = require('./ajuda');

test('comprar bloqueio e ele salvar a ofensiva sozinho', async ({ page }) => {
  const historico = ['2026-10-19', '2026-10-21', '2026-10-23', '2026-10-26', '2026-10-28', '2026-10-30', '2026-11-02', '2026-11-04'].map((data) => ({ data, treino: 'push_a' }));
  const planos = { '2026-10-18': SEG_QUA_SEX, '2026-10-25': SEG_QUA_SEX, '2026-11-01': SEG_QUA_SEX };
  // usuário antigo: sem os bloqueios de presente, 80 pontos
  await abrir(page, { quando: '2026-11-05T10:00:00', estado: { historico, bloqueiosPresente: true, planos, plano: { semana: '2026-11-01', dias: SEG_QUA_SEX } } });
  await page.click('.perfil .pontos');
  await page.click('.bloqueio-cartao .botao.secundario');
  const e = await lerEstado(page);
  expect(e.bloqueios).toEqual([expect.objectContaining({ comprado: '2026-11-05', usado: null })]);
  await page.keyboard.press('Escape');

  // não treina na sexta: faltava 1 treino para a meta, o bloqueio cobre o sábado e a ofensiva continua
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00-03:00'));
  await page.reload();
  await expect(page.locator('.perfil')).toBeVisible();
  expect((await lerEstado(page)).bloqueios[0].usado).toBe('2026-11-07');
  await expect(page.locator('.perfil .ofensiva')).toContainText('8');
});

test('usar um bloqueio hoje e devolver no mesmo dia', async ({ page }) => {
  const estado = { historico: [{ data: '2026-10-26', treino: 'push_a' }, { data: '2026-10-28', treino: 'pull_a' }], planos: { '2026-10-25': SEG_QUA_SEX }, plano: { semana: '2026-10-25', dias: SEG_QUA_SEX } };
  await abrir(page, { quando: '2026-10-31T10:00:00', estado });
  await page.click('.usar-bloqueio');
  expect((await lerEstado(page)).bloqueios.filter((b) => b.usado === '2026-10-31')).toHaveLength(1);
  await expect(page.locator('.semana')).toContainText('🧊');

  await page.click('.perfil .pontos');
  await page.click('.bloqueio-hoje .link');
  expect((await lerEstado(page)).bloqueios.filter((b) => b.usado)).toHaveLength(0);
  await page.click('.bloqueio-cartao .botao.primario');
  expect((await lerEstado(page)).bloqueios.filter((b) => b.usado)).toHaveLength(1);

  // no domingo a ofensiva continua
  await page.clock.setFixedTime(new Date('2026-11-01T10:00:00-03:00'));
  await page.reload();
  await expect(page.locator('.perfil .ofensiva')).toContainText('2');
});

test('loja: reparar a ofensiva e apostar dobro ou nada', async ({ page }) => {
  const datas = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-11-02'];
  const planos = { '2026-10-11': SEG_QUA_SEX, '2026-10-18': SEG_QUA_SEX, '2026-10-25': SEG_QUA_SEX, '2026-11-01': SEG_QUA_SEX };
  await abrir(page, { quando: '2026-11-08T10:00:00', estado: { bloqueiosPresente: true, historico: datas.map((data) => ({ data, treino: 'push_a' })), planos } });
  await expect(page.locator('.perfil .ofensiva')).toContainText('0');
  await page.click('.perfil .pontos');
  await page.click('.loja-item.destaque .botao');
  await page.click('.loja-item:has-text("Dobro ou nada") .botao');
  const e = await lerEstado(page);
  expect(e.compras.map((c) => c.tipo).sort()).toEqual(['aposta', 'reparo']);
  expect(e.apostas).toEqual([expect.objectContaining({ status: 'ativa' })]);
  await page.keyboard.press('Escape');
  expect(await texto(page.locator('.perfil .ofensiva'))).not.toMatch(/^0\b/);
});

test('armário do dia: abre uma vez por dia e o 7º dia é VIP', async ({ page }) => {
  await abrir(page, { quando: '2026-10-29T10:00:00', estado: { bloqueiosPresente: true } });
  await page.evaluate(() => { Math.random = () => 0.1; });
  await page.click('.bau-cartao');
  await expect(page.locator('.bau-folha')).toBeVisible();
  await page.click('.bau-folha .botao');
  const e = await lerEstado(page);
  expect(e.baus).toEqual([expect.objectContaining({ data: '2026-10-29' })]);
  // depois de aberto não dá para abrir de novo no mesmo dia
  await expect(page.locator('.bau-cartao.fechado')).toHaveCount(0);
  expect((await lerEstado(page)).baus).toHaveLength(1);

  await page.evaluate(() => {
    const x = JSON.parse(localStorage.getItem('ppl:estado'));
    x.baus = ['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'].map((data) => ({ data, premio: { tipo: 'pontos', valor: 5 } }));
    localStorage.setItem('ppl:estado', JSON.stringify(x));
  });
  await page.clock.setFixedTime(new Date('2026-10-30T10:00:00-03:00'));
  await page.reload();
  await expect(page.locator('.bau-cartao')).toContainText('VIP');
});

test('bordas da ofensiva no perfil', async ({ page }) => {
  const historico = [];
  for (let k = 62; k >= 1; k--) {
    const d = new Date('2026-12-30T12:00:00-03:00');
    d.setDate(d.getDate() - k);
    historico.push({ data: d.toISOString().slice(0, 10), treino: 'push_a' });
  }
  await abrir(page, { quando: '2026-12-30T10:00:00', estado: { bloqueiosPresente: true, historico } });
  await expect(page.locator('.perfil')).toHaveClass(/borda-ouro/);
  await expect(page.locator('.selo-borda')).toContainText('Ouro');
});
