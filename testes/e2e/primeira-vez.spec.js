const { test, expect, abrir, lerEstado, texto } = require('./ajuda');

test('primeira abertura: nome, sexo, personagem e programa', async ({ page }) => {
  await abrir(page, { quando: '2026-10-26T18:00:00', estado: null });
  await expect(page.locator('.boas-vindas')).toBeVisible();
  await page.fill('.campo-nome', '  Ana  ');
  await page.press('.campo-nome', 'Enter');
  await page.click('.opcao-sexo:has-text("Mulher")');
  await page.click('.opcao-personagem:has-text("Bia")');
  await page.click('.botao.fixo');

  // recomendados para mulher primeiro, depois mobilidade, depois os outros
  const grupos = await page.locator('.grupo-programas').evaluateAll((gs) => gs.map((g) => [...g.querySelectorAll('[data-programa]')].map((b) => b.dataset.programa)));
  expect(grupos[0]).toEqual(expect.arrayContaining(['feminino', 'iniciante_f', 'avancado_f']));
  expect(grupos.flat()).toContain('mobilidade');

  await page.click('[data-programa="avancado_f"]');
  await expect(page.locator('.perfil')).toBeVisible();
  await expect(page.locator('.saudacao')).toContainText('Ana');
  const e = await lerEstado(page);
  expect(e.perfil).toMatchObject({ nome: 'Ana', sexo: 'f', personagem: 'bia', programa: 'avancado_f', configurado: true });
  // todo mundo começa com 2 bloqueios de presente, e recarregar não dá mais
  expect(e.bloqueios).toHaveLength(2);
  await page.reload();
  await expect(page.locator('.perfil')).toBeVisible();
  expect((await lerEstado(page)).bloqueios).toHaveLength(2);
  expect(await texto(page.locator('.hero h2'))).not.toBe('');
});

test('nome: frase do dia muda e o nome pode ser editado', async ({ page }) => {
  await abrir(page, { quando: '2026-10-23T18:00:00' });
  const frases = new Set();
  for (const d of ['23', '24', '25', '26']) {
    await page.clock.setFixedTime(new Date(`2026-10-${d}T18:00:00-03:00`));
    await page.reload();
    const s = await texto(page.locator('.saudacao'));
    expect(s).toContain('Matheus');
    frases.add(s);
  }
  expect(frases.size).toBeGreaterThan(1);
  await page.click('.perfil .personagem-palco');
  await page.fill('.editar-nome input', 'Theo');
  await page.press('.editar-nome input', 'Tab');
  await page.keyboard.press('Escape');
  await expect(page.locator('.saudacao')).toContainText('Theo');
});
