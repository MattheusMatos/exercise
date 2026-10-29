// O estado salvo no aparelho: versão, migração e cópias de segurança.
const { test, expect, lerEstado, PERFIL } = require('./ajuda');

async function abrirCom(page, valores) {
  await page.goto('./');
  await page.evaluate((v) => {
    localStorage.clear();
    for (const [chave, valor] of Object.entries(v)) localStorage.setItem(chave, valor);
  }, valores);
  await page.reload();
}

const ler = (page, chave) => page.evaluate((c) => localStorage.getItem(c), chave);

test('estado antigo, sem versão: migra e guarda uma cópia do original', async ({ page }) => {
  const antigo = { perfil: PERFIL, historico: [{ data: '2026-10-26', treino: 'push_a' }], campoDesconhecido: 1 };
  await abrirCom(page, { 'ppl:estado': JSON.stringify(antigo) });
  await expect(page.locator('.hero')).toBeVisible();
  const e = await lerEstado(page);
  expect(e.versao).toBe(1);
  expect(e.historico).toHaveLength(1);
  expect(JSON.parse(await ler(page, 'ppl:estado:v0'))).toEqual(antigo);
  // a cópia é feita uma vez só
  await page.reload();
  expect(JSON.parse(await ler(page, 'ppl:estado:v0'))).toEqual(antigo);
});

test('estado salvo por uma versão mais nova do app: abre e guarda o original', async ({ page }) => {
  const novo = { versao: 99, perfil: PERFIL, historico: [{ data: '2026-10-26', treino: 'push_a' }], coisaNova: { a: 1 } };
  await abrirCom(page, { 'ppl:estado': JSON.stringify(novo) });
  await expect(page.locator('.hero')).toBeVisible();
  expect((await lerEstado(page)).historico).toHaveLength(1);
  expect(JSON.parse(await ler(page, 'ppl:estado:v99'))).toEqual(novo);
});

test('estado ilegível: começa do zero sem perder o texto salvo', async ({ page }) => {
  await abrirCom(page, { 'ppl:estado': '{"perfil": quebrado' });
  await expect(page.locator('.boas-vindas')).toBeVisible();
  expect(await ler(page, 'ppl:estado:ilegivel')).toBe('{"perfil": quebrado');
});

test('estado atual não faz cópia', async ({ page }) => {
  await abrirCom(page, { 'ppl:estado': JSON.stringify({ versao: 1, perfil: PERFIL }) });
  await expect(page.locator('.hero')).toBeVisible();
  const chaves = await page.evaluate(() => Object.keys(localStorage));
  expect(chaves.filter((c) => c.startsWith('ppl:estado:'))).toEqual([]);
});
