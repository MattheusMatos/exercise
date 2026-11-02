// Feriado com academia fechada: em dia de treino planejado, a ofensiva fica protegida sem gastar bloqueio.
const { test, expect, abrir, lerEstado, mudarEstado, texto } = require('./ajuda');

const SEG_QUA_SEX = [false, true, false, true, false, true, false];
const historico = ['2026-10-26', '2026-10-28', '2026-10-30'].map((data) => ({ data, treino: 'push_a' }));
const planos = { '2026-10-25': SEG_QUA_SEX, '2026-11-01': SEG_QUA_SEX };

test('véspera avisa, o dia de Finados fica protegido e a semana fecha sem gastar bloqueio', async ({ page }) => {
  await abrir(page, { quando: '2026-11-01T20:00:00', estado: { historico, planos, plano: { semana: '2026-11-01', dias: SEG_QUA_SEX } } });
  await expect(page.locator('.feriado-cartao')).toContainText('Amanhã é Finados');

  await page.clock.setFixedTime(new Date('2026-11-02T18:00:00-03:00'));
  await page.reload();
  await expect(page.locator('.feriado-cartao')).toContainText('Hoje é Finados');
  await expect(page.locator('.feriado-cartao')).toContainText('protegida');
  await expect(page.locator('.dia.feriado')).toHaveCount(1);
  await expect(page.locator('.dia.feriado .dia-numero')).toHaveText('2');
  await expect(page.locator('.saudacao')).toContainText('Finados');
  const bloqueiosAntes = (await lerEstado(page)).bloqueios.filter((b) => !b.usado).length;

  // treinou só quarta e sexta: com o feriado, a meta de 3 fecha
  await mudarEstado(page, (e) => { e.historico.push({ data: '2026-11-04', treino: 'pull_a' }, { data: '2026-11-06', treino: 'legs_a' }); });
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00-03:00'));
  await page.reload();
  await expect(page.locator('.perfil .ofensiva')).toContainText('5');
  expect((await lerEstado(page)).bloqueios.filter((b) => !b.usado).length).toBe(bloqueiosAntes);
});

test('feriado que não era dia de treino: só avisa, sem proteger', async ({ page }) => {
  const sem = [false, false, true, false, true, false, true];
  await abrir(page, { quando: '2026-11-02T18:00:00', estado: { historico, planos: { '2026-10-25': SEG_QUA_SEX, '2026-11-01': sem }, plano: { semana: '2026-11-01', dias: sem } } });
  await expect(page.locator('.feriado-cartao')).toContainText('Não era dia de treino');
  await expect(page.locator('.dia.feriado')).toHaveCount(0);
  expect(await texto(page.locator('.perfil .ofensiva'))).toContain('3');
});
