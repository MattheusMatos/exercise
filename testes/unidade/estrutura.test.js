// Confere que os arquivos do app combinam entre si: o que o index.html carrega, o que o service
// worker guarda para funcionar sem internet, e que dois arquivos de treinos/app/ não declaram o
// mesmo nome (eles dividem o mesmo escopo global; ver o começo de treinos/app/nucleo.js).
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PASTA = path.join(__dirname, '../../treinos');
const ler = (arquivo) => fs.readFileSync(path.join(PASTA, arquivo), 'utf8');
const scripts = [...ler('index.html').matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const doApp = fs.readdirSync(path.join(PASTA, 'app')).filter((f) => f.endsWith('.js')).map((f) => `app/${f}`);

test('o index.html carrega todos os arquivos de app/, terminando no inicio.js', () => {
  assert.deepStrictEqual([...scripts.filter((s) => s.startsWith('app/'))].sort(), [...doApp].sort());
  assert.strictEqual(scripts[scripts.length - 1], 'app/inicio.js');
  assert.strictEqual(scripts.filter((s) => s.startsWith('app/'))[0], 'app/nucleo.js');
});

test('o service worker guarda todos os scripts e programas', () => {
  const sw = ler('sw.js');
  for (const s of scripts) assert.ok(sw.includes(`'${s}'`), `sw.js não guarda ${s}`);
  const programas = fs.readdirSync(PASTA).filter((f) => /^programa_.*\.json$/.test(f));
  for (const p of programas) assert.ok(sw.includes(`'${p}'`), `sw.js não guarda ${p}`);
});

test('os arquivos de app/ são JavaScript válido e não repetem nomes', () => {
  const donos = new Map();
  for (const arquivo of doApp) {
    const codigo = ler(arquivo);
    assert.doesNotThrow(() => new vm.Script(codigo, { filename: arquivo }), `${arquivo} não compila`);
    for (const m of codigo.matchAll(/^(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm)) {
      const nome = m[1];
      assert.ok(!donos.has(nome), `${nome} declarado em ${donos.get(nome)} e em ${arquivo}`);
      donos.set(nome, arquivo);
    }
  }
  // Os módulos de lógica ficam em window.<Nome>; o app não pode declarar o mesmo nome.
  for (const nome of ['Ofensiva', 'Avatar', 'Aerobico', 'Retrospectiva', 'Semelhanca']) assert.ok(!donos.has(nome), `${nome} declarado no app`);
});
