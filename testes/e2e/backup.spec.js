// Backup: exportar tudo, importar em outro aparelho, e a medição de uso que fica só no aparelho.
const fs = require('fs');
const { test, expect, abrir, lerEstado, comecarTreino, terminarTreino } = require('./ajuda');

test('exporta o backup, apaga tudo e importa de volta', async ({ page }) => {
  const historico = Array.from({ length: 12 }, (_, k) => ({ data: `2026-10-${String(k + 1).padStart(2, '0')}`, treino: 'push_a' }));
  await abrir(page, { quando: '2026-11-16T18:00:00', estado: { historico, cargas: { Leg_Press: { kg: 200, data: '2026-10-10' } } } });
  // 12 treinos e nenhum backup: o lembrete aparece
  await expect(page.locator('.backup-cartao')).toContainText('12 treinos');
  await page.click('.backup-cartao .botao');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('.dados-folha .exportar')]);
  expect(download.suggestedFilename()).toBe('treino-backup-2026-11-16.json');
  const caminho = await download.path();
  const conteudo = JSON.parse(fs.readFileSync(caminho, 'utf8'));
  expect(conteudo.app).toBe('treino-ppl');
  expect(conteudo.estado.historico).toHaveLength(12);
  await page.keyboard.press('Escape');
  await expect(page.locator('.backup-cartao')).toHaveCount(0);

  // outro aparelho: começa do zero, com outro nome
  await abrir(page, { estado: { perfil: { personagem: 'bia', programa: 'feminino', sexo: 'f', nome: 'Outra', configurado: true } } });
  await page.click('.perfil .personagem-palco');
  await page.click('.abrir-dados');
  // arquivo errado é recusado
  await page.setInputFiles('.campo-arquivo', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"oi":1}') });
  await expect(page.locator('.toast')).toContainText('não é um backup');
  await page.setInputFiles('.campo-arquivo', caminho);
  await expect(page.locator('.confirmar-importar')).toContainText('Backup de Matheus, com 12 treinos');
  await page.click('.importar');
  await expect(page.locator('.saudacao')).toContainText('Matheus');
  const e = await lerEstado(page);
  expect(e.historico).toHaveLength(12);
  expect(e.cargas.Leg_Press.kg).toBe(200);
  // o que havia antes fica guardado
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ppl:estado:antes-de-importar')).perfil.nome)).toBe('Outra');
});

test('medição de uso: conta abrir, treino começado e terminado, só no aparelho', async ({ page }) => {
  const pedidos = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost')) pedidos.push(r.url()); });
  await abrir(page, { quando: '2026-11-16T18:00:00', estado: { historico: [{ data: '2026-11-10', treino: 'push_a' }] } });
  await comecarTreino(page);
  await terminarTreino(page);
  const uso = (await lerEstado(page)).uso['2026-11-16'];
  expect(uso).toMatchObject({ abrir: 1, treino_iniciado: 1, treino_feito: 1 });
  await page.getByText('Voltar ao início').click();
  await page.click('.perfil .personagem-palco');
  await page.click('.abrir-dados');
  await expect(page.locator('.lista-uso')).toContainText('Treinos terminados');
  // nada sai do aparelho além das fontes
  expect(pedidos.filter((u) => !/fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([]);
});
