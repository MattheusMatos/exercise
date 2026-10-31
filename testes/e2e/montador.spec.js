const { test, expect, abrir, lerEstado, comecarTreino, terminarTreino } = require('./ajuda');

const FOTOS = process.env.FOTOS_MONTADOR;

test('Meu treino: monta Superior e Inferior com avaliação e sugestões, salva, usa e treina', async ({ page }) => {
  await abrir(page, { quando: '2026-10-27T18:00:00' });
  await page.click('.perfil .personagem-palco');
  await page.click('#aba-treino');
  await page.click('.meu-treino-cartao .botao');
  const m = page.locator('.montador');
  await expect(m).toContainText('Como você quer dividir a semana?');
  await m.locator('[data-divisao="supinf"]').click();
  await expect(m.locator('.abas-meu [role="tab"]')).toHaveCount(4);
  // vazio: a avaliação pede para começar e as sugestões já aparecem
  await expect(m.locator('.sugestoes-meu li').first()).toBeVisible();

  // adiciona pela busca
  await m.locator('.adicionar-meu').click();
  await m.locator('.busca-meu').fill('supino reto');
  await m.locator('.item-meu').first().click();
  await expect(m.locator('.meu-exercicio')).toHaveCount(1);
  // e pelas sugestões, até ter 4 no Superior A
  for (let i = 0; i < 3; i++) await m.locator('.sugestoes-meu li .botao').first().click();
  await expect(m.locator('.meu-exercicio')).toHaveCount(4);
  await m.locator('.meu-exercicio').first().locator('[aria-label="Mais 1 série"]').click();
  await expect(m.locator('.meu-exercicio').first()).toContainText('4 séries');
  await expect(m.locator('.avisos-avaliacao')).toContainText('INFERIOR A está vazio');
  if (FOTOS) await page.screenshot({ path: `${FOTOS}/m1_editor.png`, fullPage: false });

  // salvar exige todos os treinos com exercício: preenche os outros pelas sugestões
  for (const i of [1, 2, 3]) {
    await m.locator('.abas-meu [role="tab"]').nth(i).click();
    for (let k = 0; k < 3; k++) await m.locator('.sugestoes-meu li .botao').first().click();
  }
  await m.locator('.avaliacao').scrollIntoViewIfNeeded();
  if (FOTOS) await page.screenshot({ path: `${FOTOS}/m2_avaliacao.png` });
  await m.locator('.montador-rodape .botao').click();
  await expect(m).toHaveCount(0);

  const e = await lerEstado(page);
  expect(e.perfil.programa).toBe('meu');
  expect(e.meuTreino.divisao).toBe('supinf');
  expect(e.meuTreino.treinos.map((t) => t.exercicios.length)).toEqual([4, 3, 3, 3]);
  expect(e.meuTreino.treinos[0].exercicios[0].series).toBe(4);
  await expect(page.locator('.hero h2')).toContainText('SUPERIOR A');

  // treina: cartões com as fotos da biblioteca, sem botão de vídeo
  await comecarTreino(page);
  await expect(page.locator('.cartao.topo .sprite').first()).toBeAttached();
  await expect(page.locator('.cartao.topo .video-exercicio')).toHaveCount(0);
  await terminarTreino(page);
  await page.getByText('Voltar ao início').click();

  // ao reabrir o app, o Meu treino continua (espera a biblioteca antes de montar)
  await page.reload();
  await expect(page.locator('.hero h2')).toContainText('INFERIOR A');
  expect((await lerEstado(page)).perfil.programa).toBe('meu');
});

test('Meu treino: editar mantém o que foi montado e fechar sem salvar não muda nada', async ({ page }) => {
  const meuTreino = { divisao: 'livre', dias: 3, treinos: [{ titulo: 'TREINO A', foco: [], exercicios: [{ id: 'Barbell_Full_Squat', series: 3, reps: '8–12', rir: '1–2', descanso: '2–3 min' }] }] };
  await abrir(page, { quando: '2026-10-27T18:00:00', estado: { meuTreino } });
  await page.click('.perfil .personagem-palco');
  await page.click('#aba-treino');
  await expect(page.locator('.meu-treino-cartao')).toContainText('Livre');
  await page.click('.meu-treino-cartao .botao');
  await expect(page.locator('.meu-exercicio')).toHaveCount(1);
  await page.locator('.meu-exercicio .remover').click();
  await page.locator('.montador-topo .icone-botao').click();
  expect((await lerEstado(page)).meuTreino.treinos[0].exercicios).toHaveLength(1);
});
