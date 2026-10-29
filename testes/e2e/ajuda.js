// O que os testes de tela têm em comum: abrir o app com um estado salvo, numa data fixa,
// começar e terminar um treino, e falhar se a página tiver qualquer erro de JavaScript.
const base = require('@playwright/test');

const test = base.test.extend({
  page: async ({ page }, use) => {
    const erros = [];
    page.on('pageerror', (e) => erros.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/Failed to load resource|ERR_INTERNET_DISCONNECTED/.test(m.text())) erros.push(m.text());
    });
    await use(page);
    base.expect(erros, 'erros de JavaScript na página').toEqual([]);
  },
});

const PERFIL = { personagem: 'brutus', programa: 'masculino', sexo: 'm', nome: 'Matheus', configurado: true };
const SEG_QUA_SEX = [false, true, false, true, false, true, false];

// quando: '2026-10-26T18:00:00' (horário de Brasília). estado: o que fica em ppl:estado (null = primeira vez).
async function abrir(page, { quando, estado = {} } = {}) {
  if (quando) await page.clock.install({ time: new Date(`${quando}-03:00`) });
  await page.goto('./');
  await page.evaluate((e) => {
    localStorage.clear();
    if (e) localStorage.setItem('ppl:estado', JSON.stringify(e));
  }, estado && { perfil: PERFIL, ...estado });
  await page.reload();
}

const lerEstado = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('ppl:estado')));

async function mudarEstado(page, f) {
  const e = await lerEstado(page);
  f(e);
  await page.evaluate((x) => localStorage.setItem('ppl:estado', JSON.stringify(x)), e);
}

async function comecarTreino(page, { aquecer = false } = {}) {
  await page.getByText('Começar treino').click();
  const tela = page.locator('.aquecimento-tela, .cartao.topo').first();
  await tela.waitFor();
  if (await page.locator('.aquecimento-tela').count()) {
    await page.getByText(aquecer ? 'Começar com aquecimento' : 'Pular o aquecimento de hoje').click();
  }
  await page.locator('.cartao.topo').waitFor();
}

async function pularDescanso(page) {
  if (await page.locator('.descanso.cheio').count()) await page.click('.descanso .pular');
}

// Marca "Feito" até acabar o treino.
async function terminarTreino(page) {
  for (let i = 0; i < 40 && (await page.locator('.cartao.topo').count()); i++) {
    await pularDescanso(page);
    await page.click('.acao.feito');
    await page.waitForTimeout(350);
  }
  await page.locator('.fim').waitFor();
}

const texto = async (locator) => ((await locator.textContent()) || '').replace(/\s+/g, ' ').trim();

module.exports = { test, expect: base.expect, abrir, lerEstado, mudarEstado, comecarTreino, pularDescanso, terminarTreino, texto, PERFIL, SEG_QUA_SEX };
