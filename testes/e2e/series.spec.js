// Registro por série: carga × repetições, sugestão de carga, recorde e a folha de evolução.
const { test, expect, abrir, lerEstado, comecarTreino, pularDescanso, texto } = require('./ajuda');

const FOTOS = process.env.FOTOS_SERIES;
const SUPINO = 'Barbell_Bench_Press_-_Medium_Grip';
const reg = (data, series) => series.map(([kg, reps], n) => ({ data, ex: SUPINO, n, kg, reps }));

test('marca as séries com carga e repetições, e desmarcar apaga', async ({ page }) => {
  await abrir(page, { quando: '2026-11-16T18:00:00' });
  await comecarTreino(page);
  const topo = page.locator('.cartao.topo');
  await topo.locator('.campo-kg').fill('60');
  await topo.locator('.campo-kg').blur();
  for (const reps of ['10', '9']) {
    await topo.locator('.campo-reps').fill(reps);
    await topo.locator('.anilha:not(.cheia)').first().click();
    await pularDescanso(page);
  }
  await expect(topo.locator('.series-feitas')).toHaveText('Hoje: 60×10 · 60×9');
  let e = await lerEstado(page);
  expect(e.registroSeries).toEqual([
    { data: '2026-11-16', ex: SUPINO, n: 0, kg: 60, reps: 10 },
    { data: '2026-11-16', ex: SUPINO, n: 1, kg: 60, reps: 9 },
  ]);
  // tocar de novo na 2ª série desmarca e apaga o registro dela
  await topo.locator('.anilha').nth(1).click();
  await expect(topo.locator('.series-feitas')).toHaveText('Hoje: 60×10');
  e = await lerEstado(page);
  expect(e.registroSeries).toHaveLength(1);
});

test('sugere subir a carga quando a última vez bateu o topo da faixa, e avisa o recorde', async ({ page }) => {
  const registroSeries = [...reg('2026-11-02', [[57.5, 10], [57.5, 9], [57.5, 8]]), ...reg('2026-11-09', [[60, 10], [60, 10], [60, 10]])];
  await abrir(page, { quando: '2026-11-16T18:00:00', estado: { registroSeries, cargas: { [SUPINO]: { kg: 60, data: '2026-11-09' } } } });
  await comecarTreino(page);
  const topo = page.locator('.cartao.topo');
  // Supino reto no Push A é 4 × 6–10: três séries de 10 batem o topo
  await expect(topo.locator('.dica-carga')).toContainText('Última vez: 60 kg × 10, 10, 10');
  await expect(topo.locator('.dica-carga')).toContainText('suba para 61,5 kg');
  await expect(topo.locator('.campo-kg')).toHaveValue('61,5');
  await expect(topo.locator('.campo-reps')).toHaveValue('6');
  await topo.locator('.campo-reps').fill('10');
  await topo.locator('.anilha').first().click();
  await expect(page.locator('.toast')).toContainText('Recorde');
  await pularDescanso(page);

  await topo.locator('.ver-evolucao').click();
  const folha = page.locator('.evolucao-folha');
  await expect(folha.locator('.grafico-evolucao .ponto')).toHaveCount(3);
  await expect(folha.locator('.evolucao-tabela tbody tr')).toHaveCount(3);
  await expect(folha.locator('.grafico-dica')).toContainText('61,5×10');
  await folha.locator('.alvo').first().click();
  await expect(folha.locator('.grafico-dica')).toContainText('02/11');
  if (FOTOS) { await page.screenshot({ path: `${FOTOS}/s_evolucao.png` }); }
  await page.keyboard.press('Escape');
  if (FOTOS) { await page.screenshot({ path: `${FOTOS}/s_cartao.png` }); }
  expect(await texto(topo.locator('.series-feitas'))).toBe('Hoje: 61,5×10');
});

test('plano do dia na tela inicial, e a semana leve quando 3 exercícios estagnam', async ({ page }) => {
  const parado = (ex, kg) => ['2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09'].flatMap((data) => [0, 1, 2].map((n) => ({ data, ex, n, kg, reps: 8 })));
  const registroSeries = [
    ...parado(SUPINO, 60), ...parado('Incline_Dumbbell_Press', 24), ...parado('Cable_Crossover', 20),
    ...[0, 1, 2].map((n) => ({ data: '2026-11-09', ex: 'Side_Lateral_Raise', n, kg: 8, reps: 20 })),
  ];
  const historico = [{ data: '2026-11-09', treino: 'push_a' }];
  await abrir(page, { quando: '2026-11-16T18:00:00', estado: { registroSeries, historico } });
  await expect(page.locator('.plano-do-dia')).toContainText('recomeçar em');
  await expect(page.locator('.exercicios-treino li').first().locator('.selo-plano')).toHaveClass(/plano-destravar/);
  await expect(page.locator('.exercicios-treino li').first().locator('.selo-plano')).toContainText('54 kg');

  const cartao = page.locator('.semana-leve-cartao');
  await expect(cartao).toContainText('3 exercícios sem evoluir');
  await cartao.locator('.botao.primario').click();
  await expect(page.locator('.semana-leve-cartao.ativa')).toBeVisible();
  await expect(page.locator('.plano-do-dia')).toContainText('semana leve em');
  expect((await lerEstado(page)).semanaLeve).toBe('2026-11-15');
  await comecarTreino(page);
  await expect(page.locator('.cartao.topo .dica-carga')).toContainText('Semana leve: 54 kg');
});
