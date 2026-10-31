const { test, expect, abrir, lerEstado, comecarTreino, pularDescanso, texto } = require('./ajuda');

test('Experimente: abre a história do método, escolhe o Mentzer clássico e faz a pré-exaustão sem descanso', async ({ page }) => {
  await abrir(page, { quando: '2026-11-01T10:00:00' });
  await page.click('.perfil .personagem-palco');
  await page.click('#aba-treino');
  const grupo = page.locator('.grupo-programas:has-text("Experimente")');
  await expect(grupo.locator('[data-programa]')).toHaveCount(7);
  await grupo.locator('[data-programa="mentzer_classico"]').click();
  const folha = page.locator('.metodo-folha');
  await expect(folha).toContainText('Mike Mentzer');
  await expect(folha).toContainText('O que a ciência corrigiu');
  await expect.poll(() => folha.locator('.metodo-arte img').evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await folha.getByText('Experimentar este treino').click();
  const trocar = page.getByText('Trocar mesmo assim');
  if (await trocar.count()) await trocar.click();
  await page.keyboard.press('Escape');
  expect((await lerEstado(page)).perfil.programa).toBe('mentzer_classico');

  // domingo: a pergunta da semana oferece só 2 dias
  await expect(page.locator('.opcao-dia')).toHaveCount(1);
  await page.click('.opcao-dia');
  await comecarTreino(page);
  const topo = page.locator('.cartao.topo');
  await expect(topo.locator('h2')).toContainText('Voador');
  await expect(topo.locator('.tecnica')).toContainText('Pré-exaustão');
  await expect(topo.locator('.anilha')).toHaveCount(1);
  await topo.locator('.anilha').first().click();
  // sem descanso: vai direto ao supino inclinado
  await expect(topo.locator('h2')).toContainText('Supino inclinado');
  await expect(page.locator('.descanso:not([hidden])')).toHaveCount(0);
  await topo.locator('.anilha').first().click();
  await expect(page.locator('.descanso')).toBeVisible();
  await pularDescanso(page);
});

test('Experimente: Mentzer moderno oferece 3 ou 4 dias', async ({ page }) => {
  await abrir(page, { quando: '2026-11-01T10:00:00', estado: { perfil: { personagem: 'brutus', programa: 'mentzer_moderno', sexo: 'm', nome: 'Matheus', configurado: true } } });
  await expect(page.locator('.opcao-dia')).toHaveCount(2);
  expect(await texto(page.locator('.opcoes-dias'))).toMatch(/3.*4/);
});

const METODOS = { cinco_por_cinco: 1, german_volume: 1, arnold: 2, phul: 1, fst7: 2 };
for (const [id, opcoes] of Object.entries(METODOS)) {
  test(`Experimente: ${id} abre a folha com a ilustração e começa o primeiro treino`, async ({ page }) => {
    await abrir(page, { quando: '2026-11-01T10:00:00' });
    await page.click('.perfil .personagem-palco');
    await page.click('#aba-treino');
    await page.click(`[data-programa="${id}"]`);
    const folha = page.locator('.metodo-folha');
    await expect(folha).toContainText('O que a ciência corrigiu');
    await expect(folha.locator('.metodo-referencias, details li').first()).toBeAttached();
    await expect.poll(() => folha.locator('.metodo-arte img').evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
    await folha.getByText('Experimentar este treino').click();
    await page.keyboard.press('Escape');
    expect((await lerEstado(page)).perfil.programa).toBe(id);
    await expect(page.locator('.opcao-dia')).toHaveCount(opcoes);
    await page.locator('.opcao-dia').last().click();
    await comecarTreino(page);
    await expect(page.locator('.cartao.topo h2')).not.toBeEmpty();
    await expect.poll(() => page.locator('.cartao.topo .pose-a').evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  });
}

test('Experimente: FST-7 mostra a técnica e descanso curto nas 7 séries', async ({ page }) => {
  await abrir(page, { quando: '2026-11-03T18:00:00', estado: { perfil: { personagem: 'brutus', programa: 'fst7', sexo: 'm', nome: 'Matheus', configurado: true }, plano: { semana: '2026-11-01', dias: [false, true, true, false, true, true, false] } } });
  await comecarTreino(page);
  for (let i = 0; i < 2; i++) {
    await page.click('.acao.feito');
    await page.waitForTimeout(350);
  }
  const topo = page.locator('.cartao.topo');
  await expect(topo.locator('h2')).toContainText('FST-7');
  await expect(topo.locator('.anilha')).toHaveCount(7);
  await expect(topo.locator('.tecnica')).toContainText('fáscia');
  await topo.locator('.anilha').first().click();
  await expect(page.locator('.descanso .relogio')).toContainText(/0:(3|4)\d/);
});
