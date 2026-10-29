const fs = require('fs');
const { test, expect, abrir, lerEstado, comecarTreino, terminarTreino, texto, SEG_QUA_SEX } = require('./ajuda');

test('aeróbico: cronômetro com tempo livre, pausa ao recarregar e pontos até 30 min', async ({ page }) => {
  await abrir(page, { quando: '2026-10-26T18:00:00', estado: { plano: { semana: '2026-10-25', dias: SEG_QUA_SEX } } });
  await comecarTreino(page);
  await terminarTreino(page);
  await page.click('.aerobico-cartao.convite');
  await page.click('.aerobico-linha:has-text("Elíptico")');
  await page.getByText('Abrir cronômetro').click();
  await page.click('.crono-aerobico .opcoes-minutos button:has-text("15 min")');
  await page.click('.crono-passo[aria-label="Mais 1 minuto"]');
  await page.click('.crono-passo[aria-label="Mais 1 minuto"]');
  await expect(page.locator('.crono-aerobico')).toContainText('17');
  await page.click('.crono-aerobico .botao.primario');
  await page.clock.runFor(5 * 60000 + 2000);
  await page.click('.crono-botoes .botao.secundario'); // pausa
  await page.reload();
  await expect(page.locator('.crono-aerobico')).toBeVisible(); // continua depois de fechar o app
  await page.click('.crono-botoes .botao.secundario'); // retoma
  await page.clock.runFor(12 * 60000 + 2000);
  await expect(page.locator('.crono-feito')).toBeVisible();
  await page.click('.crono-aerobico .botao');
  const aer = (await lerEstado(page)).aerobicos;
  expect(aer).toEqual([expect.objectContaining({ data: '2026-10-26', tipo: 'eliptico', minutos: 17 })]);
});

test('biblioteca: trocar um exercício do treino', async ({ page }) => {
  await abrir(page, { quando: '2026-10-26T18:00:00', estado: { plano: { semana: '2026-10-25', dias: SEG_QUA_SEX } } });
  await comecarTreino(page);
  const antes = await texto(page.locator('.cartao.topo h2'));
  await page.click('.cartao.topo .trocar');
  await expect(page.locator('.biblioteca .item-bib').first()).toBeVisible();
  await page.locator('.biblioteca .item-bib').nth(1).click();
  await page.locator('.bib-acoes .botao.primario').click();
  await expect(page.locator('.cartao.topo h2')).not.toHaveText(antes);
  expect(Object.keys((await lerEstado(page)).trocas || {})).not.toHaveLength(0);
});

test('compartilhar: gera a imagem do treino nas cores escolhidas', async ({ page }) => {
  await abrir(page, { quando: '2026-10-29T18:00:00', estado: { peso: 80, historico: ['2026-10-26', '2026-10-27', '2026-10-28'].map((data) => ({ data, treino: 'push_a' })) } });
  await comecarTreino(page);
  await page.clock.runFor(52 * 60000);
  await terminarTreino(page);
  await page.click('.compartilhar');
  await expect(page.locator('.card-previa')).toBeVisible();
  const tamanho = await page.locator('.card-previa').evaluate(async (img) => {
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  });
  expect(tamanho).toEqual([1080, 1920]);
  await expect(page.locator('.opcoes-estilo button')).toHaveCount(5);
});

test('retrospectiva do mês com recordes de carga e imagem de resumo', async ({ page }) => {
  const ids = ['push_a', 'pull_a', 'legs_a', 'push_b', 'pull_b', 'legs_b'];
  const historico = [];
  let k = 0;
  for (let d = 1; d <= 31; d++) {
    if ([1, 2, 3, 4, 5].includes(new Date(2026, 9, d).getDay())) historico.push({ data: `2026-10-${String(d).padStart(2, '0')}`, treino: ids[k++ % 6], minutos: 55 });
  }
  const supino = 'Barbell_Bench_Press_-_Medium_Grip';
  const registroCargas = [
    { data: '2026-09-29', ex: supino, kg: 60 }, { data: '2026-10-13', ex: supino, kg: 65 }, { data: '2026-10-27', ex: supino, kg: 70 },
    { data: '2026-10-08', ex: 'Barbell_Full_Squat', kg: 85 },
  ];
  await abrir(page, { quando: '2026-11-03T10:00:00', estado: { bloqueiosPresente: true, peso: 80, historico, registroCargas, pesos: [{ data: '2026-10-01', kg: 82 }, { data: '2026-10-30', kg: 80.4 }] } });
  await page.click('.retro-convite');
  await expect(page.locator('.retro-tela')).toBeVisible();
  const telas = await page.locator('.retro-barras span').count();
  const textos = [];
  for (let i = 0; i < telas; i++) {
    textos.push(await texto(page.locator('.retro-tela')));
    if (i < telas - 1) await page.mouse.click(330, 500);
  }
  expect(textos[0]).toContain('outubro');
  const recordes = textos.find((t) => t.includes('Recordes de carga'));
  expect(recordes).toMatch(/1\s*recorde novo/);
  expect(recordes).toContain('85 kg');
  expect(recordes).toContain('70 kg');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('.retro .botao.primario')]);
  const arquivo = await download.path();
  expect(fs.statSync(arquivo).size).toBeGreaterThan(10000);
});
