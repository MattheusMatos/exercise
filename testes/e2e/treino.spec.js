const { test, expect, abrir, lerEstado, comecarTreino, pularDescanso, terminarTreino, texto, SEG_QUA_SEX } = require('./ajuda');

test('treino avançado: aquecimento, carga, mini-pausa, bi-set e fim com avaliação', async ({ page }) => {
  await abrir(page, { quando: '2026-10-26T18:00:00', estado: { perfil: { personagem: 'bia', programa: 'avancado_f', sexo: 'f', nome: 'Ana', configurado: true }, plano: { semana: '2026-10-25', dias: SEG_QUA_SEX } } });
  await comecarTreino(page, { aquecer: true });

  const topo = page.locator('.cartao.topo');
  await expect(topo.locator('.aquecimento')).toBeVisible();
  await topo.locator('.campo-carga input').fill('80');
  await topo.locator('.campo-carga input').press('Enter');
  await topo.locator('.campo-carga input').blur();
  // aquecimento 40% e 80% da carga
  await expect(topo.locator('.aquecimento')).toContainText('32');
  await expect(topo.locator('.aquecimento')).toContainText('64');
  await topo.locator('.serie-aquecimento').first().click();
  await expect(page.locator('.descanso')).toBeVisible();
  await page.click('.descanso .pular');

  // termina os dois primeiros exercícios série a série
  for (let ex = 0; ex < 2; ex++) {
    const n = await topo.locator('.anilha').count();
    for (let k = 0; k < n; k++) {
      await topo.locator('.anilha').nth(k).click();
      await pularDescanso(page);
    }
    await page.click('.acao.feito');
    await page.waitForTimeout(400);
  }
  // bi-set: depois da 1ª série vai direto para o par, sem descanso
  await expect(topo.locator('.tecnica-aviso')).toBeVisible();
  const primeiro = await texto(topo.locator('h2'));
  await topo.locator('.anilha').first().click();
  await page.waitForTimeout(300);
  expect(await texto(topo.locator('h2'))).not.toBe(primeiro);
  await expect(page.locator('.descanso:not([hidden])')).toHaveCount(0);

  await terminarTreino(page);
  await expect(page.locator('.fim-destaque')).toBeVisible();
  await page.click('.opcoes-esforco button:has-text("No limite")');
  await page.click('.ajuste:has-text("+30 s")');
  const e = await lerEstado(page);
  expect(e.historico).toHaveLength(1);
  expect(e.historico[0]).toMatchObject({ data: '2026-10-26', esforco: 'limite' });
  expect(Object.keys(e.ajustes)).toHaveLength(1);
  expect(e.cargas).toBeTruthy();
  expect(e.registroCargas).toEqual([expect.objectContaining({ data: '2026-10-26', kg: 80 })]);
});

test('ao marcar Feito com o descanso rodando, o descanso some', async ({ page }) => {
  await abrir(page, { quando: '2026-10-26T18:00:00' });
  await comecarTreino(page);
  await page.locator('.cartao.topo .anilha').first().click();
  await expect(page.locator('.descanso.cheio')).toBeVisible();
  await page.click('.minimizar');
  await page.click('.acao.feito');
  await page.waitForTimeout(400);
  await expect(page.locator('.descanso:not([hidden])')).toHaveCount(0);
});

test('desfazer pelo aviso, chips dos próximos e campo de carga sem desfazer', async ({ page }) => {
  await abrir(page, { quando: '2026-10-27T18:00:00' });
  await comecarTreino(page);
  const topo = page.locator('.cartao.topo h2');
  const primeiro = await texto(topo);
  await expect(page.locator('.proximos')).toBeVisible();

  await page.click('.acao.feito');
  await page.waitForTimeout(400);
  await expect(page.locator('.desfazer-aviso')).toBeVisible();
  // apagar a carga com Backspace não desfaz o exercício
  const segundo = await texto(topo);
  await page.fill('.cartao.topo .campo-carga input', '30');
  await page.focus('.cartao.topo .campo-carga input');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  expect(await texto(topo)).toBe(segundo);
  expect((await lerEstado(page)).sessao.feitos).toHaveLength(1);

  // voltar ao início e continuar mantém o progresso
  await page.click('.icone-botao[aria-label="Voltar ao início"]');
  await page.getByText('Continuar').click();
  await expect(topo).toHaveText(segundo);

  // tocar num próximo traz ele para a frente
  const chip = await texto(page.locator('.proximo-chip').nth(1));
  await page.locator('.proximo-chip').nth(1).click();
  await page.waitForTimeout(300);
  expect(chip).toContain(await texto(topo));

  // Depois + desfazer volta o mesmo
  const antes = await texto(topo);
  await page.click('.acao.depois');
  await page.waitForTimeout(400);
  await page.click('.desfazer-aviso .link');
  await page.waitForTimeout(300);
  await expect(topo).toHaveText(antes);
  expect(primeiro).not.toBe(antes);

  // o aviso some sozinho depois de 6 s
  await page.click('.acao.feito');
  await page.clock.runFor(7000);
  await expect(page.locator('.desfazer-aviso')).toBeHidden();
});

test('fim do treino: tempo, calorias pelo esforço e ajuste salvo', async ({ page }) => {
  await abrir(page, { quando: '2026-10-27T18:00:00', estado: { peso: 80, perfil: { personagem: 'ravi', programa: 'iniciante_m', sexo: 'm', configurado: true }, plano: { semana: '2026-10-25', dias: SEG_QUA_SEX } } });
  await comecarTreino(page);
  await page.clock.runFor(47 * 60000 + 12000);
  await expect(page.locator('.contador-linha')).toContainText('47');
  await terminarTreino(page);
  await expect(page.locator('.fim-destaque')).toContainText('47');
  const kcal = page.locator('.fim-destaque .resumo div:nth-child(3) dd');
  const normal = await texto(kcal);
  await page.click('.opcoes-esforco button:has-text("Pesado")');
  expect(await texto(kcal)).not.toBe(normal);
  await page.click('.opcoes-esforco button:has-text("Leve")');
  await page.locator('.ajuste').first().click();
  expect(Object.keys((await lerEstado(page)).ajustes)).toHaveLength(1);
});

test('mobilidade: sem campo de carga e sem troca de exercício', async ({ page }) => {
  await abrir(page, { quando: '2026-10-26T18:00:00', estado: { perfil: { personagem: 'bia', programa: 'mobilidade', sexo: 'f', configurado: true } } });
  await comecarTreino(page);
  await expect(page.locator('.cartao.topo .campo-carga')).toHaveCount(0);
  await expect(page.locator('.cartao.topo .trocar')).toHaveCount(0);
});
