const { test, expect, abrir, lerEstado, comecarTreino, terminarTreino, texto, SEG_QUA_SEX } = require('./ajuda');

const tira = (page) => page.locator('.semana .dia').evaluateAll((els) => els.map((el) => ({
  numero: el.querySelector('.dia-numero').textContent,
  status: ['feito', 'planejado', 'faltou', 'protegido'].find((c) => el.classList.contains(c)) || 'descanso',
})));

test('domingo: escolhe quantos dias, liga um dia e cria lembrete', async ({ page }) => {
  await abrir(page, { quando: '2026-10-25T10:00:00' });
  await expect(page.locator('.pergunta-texto')).toBeVisible();
  await page.click('.opcao-dia:has-text("4")');
  const dias = await tira(page);
  expect(dias.filter((d) => d.status === 'planejado').length).toBe(4);
  await page.click('.dia:has(.dia-numero:text-is("28"))');
  expect((await tira(page)).filter((d) => d.status === 'planejado').length).toBe(5);

  await page.click('.semana-cartao .link:has-text("Lembrete")');
  const url = new URL(await page.getAttribute('.folha a.botao.primario', 'href'));
  expect(url.hostname).toBe('calendar.google.com');
  expect(url.searchParams.get('recur')).toContain('WEEKLY');
  const ics = await page.evaluate(async () => (await (await fetch('lembrete-domingo.ics')).text()).includes('RRULE:FREQ=WEEKLY;BYDAY=SU'));
  expect(ics).toBe(true);
});

test('extra fixo no próximo treino e extra só de hoje', async ({ page }) => {
  await abrir(page, { quando: '2026-10-26T18:00:00', estado: { plano: { semana: '2026-10-25', dias: SEG_QUA_SEX } } });
  const antes = await page.locator('.exercicios-treino .ex-nome').count();
  await page.click('.hero .botao:has-text("Adicionar exercício")');
  await expect(page.locator('.recomendacao').first()).toBeVisible();
  await page.locator('.recomendacao').nth(2).click();
  await page.click('.bib-acoes .botao.secundario'); // Adicionar sempre
  await expect(page.locator('.exercicios-treino .ex-nome')).toHaveCount(antes + 1);
  expect(Object.keys((await lerEstado(page)).extras)).toHaveLength(1);

  await comecarTreino(page);
  const contador = await texto(page.locator('.contador'));
  await page.click('.icone-botao[aria-label="Adicionar exercício"]');
  await page.locator('.recomendacao').first().click();
  await page.getByText('Adicionar só hoje').click();
  await expect(page.locator('.contador')).not.toHaveText(contador);
  await terminarTreino(page);
  await page.getByText('Voltar ao início').click();
  // o extra só de hoje não fica salvo nos fixos
  expect(Object.values((await lerEstado(page)).extras).flat()).toHaveLength(1);
  expect((await tira(page)).find((d) => d.numero === '26').status).toBe('feito');
});

test('dia que faltou: escolher fazer o que faltou ou pular', async ({ page }) => {
  const estado = { proximo: 1, historico: [{ data: '2026-10-26', treino: 'push_a' }], planos: { '2026-10-25': SEG_QUA_SEX }, plano: { semana: '2026-10-25', dias: SEG_QUA_SEX } };
  await abrir(page, { quando: '2026-10-29T10:00:00', estado });
  await expect(page.locator('.falta-aviso')).toBeVisible();
  const recomendado = await texto(page.locator('.hero h2'));
  await page.click('.falta-aviso .botao.secundario');
  await expect(page.locator('.falta-aviso')).toHaveCount(0);
  expect(await texto(page.locator('.hero h2'))).not.toBe(recomendado);

  await abrir(page, { estado });
  await page.click('.falta-aviso .botao.primario');
  await expect(page.locator('.aquecimento-tela')).toBeVisible();
});
