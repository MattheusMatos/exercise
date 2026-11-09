// Código de presente na loja: pontos e ofensiva de volta, uma vez por aparelho.
// O código de teste é registrado aqui mesmo (o app só guarda o hash dos códigos de verdade).
const { test, expect, abrir, lerEstado, texto } = require('./ajuda');

const SEG_QUA_SEX = [false, true, false, true, false, true, false];

test('código de presente dá pontos e devolve a ofensiva, uma vez só', async ({ page }) => {
  // 3 semanas cumprindo a meta e, na semana de 01/11, só segunda: a ofensiva apagou na sexta 06/11
  const datas = ['2026-10-12', '2026-10-14', '2026-10-16', '2026-10-19', '2026-10-21', '2026-10-23', '2026-10-26', '2026-10-28', '2026-10-30', '2026-11-02'];
  const planos = { '2026-10-11': SEG_QUA_SEX, '2026-10-18': SEG_QUA_SEX, '2026-10-25': SEG_QUA_SEX, '2026-11-01': SEG_QUA_SEX };
  await abrir(page, { quando: '2026-11-09T10:00:00', estado: { bloqueiosPresente: true, historico: datas.map((data) => ({ data, treino: 'push_a' })), planos } });
  await expect(page.locator('.perfil .ofensiva')).toContainText('0');
  await page.evaluate(async () => {
    const hash = await hashDoCodigo('teste-123');
    PRESENTES[hash] = { pontos: 200, ofensiva: true };
  });
  await page.click('.perfil .pontos');
  const antes = Number((await texto(page.locator('.saldo-loja'))).match(/\d+/)[0]);
  await page.fill('.campo-presente', 'errado');
  await page.click('.presente-cartao .botao');
  await expect(page.locator('.toast')).toContainText('Código inválido');

  await page.fill('.campo-presente', 'teste-123');
  await page.click('.presente-cartao .botao');
  await expect(page.locator('.toast')).toContainText('+200 pontos');
  await expect(page.locator('.toast')).toContainText('ofensiva de 10 dias de volta');
  await expect(page.locator('.saldo-loja')).toContainText(String(antes + 200));
  await page.keyboard.press('Escape');
  await expect(page.locator('.perfil .ofensiva')).toContainText('10');

  await page.click('.perfil .pontos');
  await page.fill('.campo-presente', 'TESTE-123');
  await page.click('.presente-cartao .botao');
  await expect(page.locator('.toast')).toContainText('já foi usado');
  // continua depois de recarregar
  await page.reload();
  expect((await lerEstado(page)).presentes).toHaveLength(1);
  await expect(page.locator('.perfil .ofensiva')).toContainText('10');
});
