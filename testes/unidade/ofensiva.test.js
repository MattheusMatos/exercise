const { test } = require('node:test');
const assert = require('node:assert');
const O = require('../../treinos/ofensiva.js');

const h = (...datas) => datas.map((data) => ({ data, treino: 'x' }));
const SEG_QUA_SEX = [false, true, false, true, false, true, false];

test('sem histórico', () => {
  const r = O.calcular([], {}, '2026-10-26');
  assert.deepStrictEqual([r.dias, r.humor, r.nivel], [0, 'novo', 0]);
});
test('três treinos na meta de 3', () => {
  const r = O.calcular(h('2026-10-26', '2026-10-28', '2026-10-30'), { '2026-10-25': SEG_QUA_SEX }, '2026-10-31');
  assert.deepStrictEqual([r.dias, r.nivel, r.risco, r.humor], [3, 1, false, 'animado']);
});
test('semana sem plano pede 1 treino', () => {
  const r = O.calcular(h('2026-10-26', '2026-10-28', '2026-10-30', '2026-11-03'), { '2026-10-25': SEG_QUA_SEX }, '2026-11-05');
  assert.deepStrictEqual([r.dias, r.risco], [4, false]);
});
test('ainda dá para compensar na quinta', () => {
  const r = O.calcular(h('2026-10-26'), { '2026-10-25': SEG_QUA_SEX }, '2026-10-29');
  assert.deepStrictEqual([r.dias, r.risco], [1, false]);
});
test('sexta sem treinar: risco', () => {
  const r = O.calcular(h('2026-10-26'), { '2026-10-25': SEG_QUA_SEX }, '2026-10-30');
  assert.deepStrictEqual([r.dias, r.risco], [1, true]);
});
test('treinou na sexta em risco: salva', () => {
  const r = O.calcular(h('2026-10-26', '2026-10-30'), { '2026-10-25': SEG_QUA_SEX }, '2026-10-30');
  assert.deepStrictEqual([r.dias, r.risco, r.treinouHoje], [2, false, true]);
});
test('apaga no sábado e recomeça na semana seguinte', () => {
  const planos = { '2026-10-25': SEG_QUA_SEX };
  const sabado = O.calcular(h('2026-10-26'), planos, '2026-10-31');
  assert.strictEqual(sabado.dias, 0);
  const r = O.calcular(h('2026-10-26', '2026-11-02'), planos, '2026-11-02');
  assert.deepStrictEqual([r.dias, r.recorde], [1, 1]);
});
test('depois de apagar, treinar na mesma semana já conta', () => {
  const planos = { '2026-10-25': [false, true, true, true, true, true, false] };
  // meta 5, só treinou segunda: na quarta à noite apaga (1 + 3 < 5); treina quinta e sexta
  const r = O.calcular(h('2026-10-26', '2026-10-29', '2026-10-30'), planos, '2026-10-31');
  assert.deepStrictEqual([r.dias, r.recorde], [2, 2]);
});
test('Agora não (plano vazio) pede 1 treino', () => {
  const r = O.calcular(h('2026-10-20'), { '2026-10-25': Array(7).fill(false) }, '2026-10-31');
  assert.strictEqual(r.dias, 1);
  const r2 = O.calcular(h('2026-10-20'), { '2026-10-25': Array(7).fill(false) }, '2026-11-01');
  assert.strictEqual(r2.dias, 0);
});
test('humor por dias sem treinar', () => {
  const dias = [0, 1, 2, 3, 4, 7, 8, 14, 15, 30].map((n) => O.calcular(h('2026-10-01'), {}, `2026-10-${String(1 + n).padStart(2, '0')}`).humor);
  assert.deepStrictEqual(dias, ['animado', 'animado', 'bem', 'bem', 'triste', 'triste', 'magro', 'magro', 'sedentario', 'sedentario']);
});
test('dois treinos no mesmo dia contam 1', () => {
  const r = O.calcular(h('2026-10-26', '2026-10-26'), {}, '2026-10-26');
  assert.strictEqual(r.dias, 1);
});
test('níveis', () => {
  assert.deepStrictEqual([0, 2, 3, 6, 7, 14, 15, 29, 30, 49, 50, 200].map(O.nivel), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  assert.deepStrictEqual([0, 3, 49, 50].map(O.faltamParaSubir), [3, 4, 1, null]);
});
test('6 semanas seguidas batendo a meta de 3', () => {
  const datas = [];
  const planos = {};
  for (let s = 0; s < 6; s++) {
    const dom = new Date(2026, 8, 6 + 7 * s);
    planos[`${dom.getFullYear()}-${String(dom.getMonth() + 1).padStart(2, '0')}-${String(dom.getDate()).padStart(2, '0')}`] = SEG_QUA_SEX;
    for (const d of [1, 3, 5]) {
      const x = new Date(2026, 8, 6 + 7 * s + d);
      datas.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`);
    }
  }
  const r = O.calcular(h(...datas), planos, '2026-10-17');
  assert.deepStrictEqual([r.dias, r.nivel], [18, 3]);
});
