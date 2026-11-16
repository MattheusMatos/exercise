const { test } = require('node:test');
const assert = require('node:assert');
const P = require('../../treinos/progressao.js');

const reg = (data, series) => series.map(([kg, reps], n) => ({ data, ex: 'supino', n, kg, reps }));

test('faixa de repetições e força estimada', () => {
  assert.deepStrictEqual(P.faixa('8–12'), { min: 8, max: 12 });
  assert.deepStrictEqual(P.faixa('5'), { min: 5, max: 5 });
  assert.strictEqual(P.faixa('30 s por lado'), null);
  assert.strictEqual(P.forca(60, 10), 80);
  assert.strictEqual(P.forca(60, 30), P.forca(60, 12)); // acima de 12, usa 12
});

test('bateu o topo em todas as séries: sobe a carga e volta à base da faixa', () => {
  const s = P.sugestao(reg('2026-11-10', [[60, 12], [60, 12], [60, 12]]), 'supino', '8–12', 3);
  assert.deepStrictEqual([s.tipo, s.kg, s.reps], ['subir', 61.5, 8]);
});

test('dentro da faixa: mantém a carga e pede 1 repetição a mais', () => {
  const s = P.sugestao(reg('2026-11-10', [[60, 11], [60, 10], [60, 9]]), 'supino', '8–12', 3);
  assert.deepStrictEqual([s.tipo, s.kg, s.reps], ['manter', 60, 10]);
});

test('abaixo da faixa: baixa a carga', () => {
  const s = P.sugestao(reg('2026-11-10', [[60, 8], [60, 6], [60, 5]]), 'supino', '8–12', 3);
  assert.deepStrictEqual([s.tipo, s.kg], ['baixar', 55.5]);
});

test('usa a sessão mais recente e ignora séries sem repetições', () => {
  const r = [...reg('2026-11-03', [[50, 12], [50, 12]]), ...reg('2026-11-10', [[60, 9], [60, 9]]), { data: '2026-11-12', ex: 'supino', n: 0, kg: 60, reps: null }];
  assert.strictEqual(P.sugestao(r, 'supino', '8–12', 3).tipo, 'manter');
  assert.strictEqual(P.sugestao([], 'supino', '8–12', 3), null);
  assert.strictEqual(P.sessoes(r, 'supino').length, 3);
});

test('recorde: só quando passa da melhor força estimada anterior', () => {
  const r = reg('2026-11-03', [[60, 10]]);
  assert.strictEqual(P.ehRecorde(r, 'supino', 60, 11), true);
  assert.strictEqual(P.ehRecorde(r, 'supino', 62.5, 8), false);
  assert.strictEqual(P.ehRecorde([], 'supino', 60, 10), false); // a primeira vez não é recorde
});

test('estagnado: 3 sessões seguidas sem passar da melhor anterior pede recomeço com 10% menos', () => {
  const r = [...reg('2026-10-20', [[60, 10]]), ...reg('2026-10-27', [[60, 10]]), ...reg('2026-11-03', [[60, 9]]), ...reg('2026-11-10', [[60, 10]])];
  assert.strictEqual(P.estagnado(r, 'supino'), true);
  const s = P.sugestao(r, 'supino', '8–12', 3);
  assert.deepStrictEqual([s.tipo, s.kg, s.reps], ['destravar', 54, 12]);
  // evoluindo não é estagnado
  assert.strictEqual(P.estagnado([...r, ...reg('2026-11-17', [[62.5, 10]])], 'supino'), false);
  assert.strictEqual(P.estagnado(r.slice(0, 3), 'supino'), false); // menos de 4 sessões
});

test('semana leve: 10% menos carga em qualquer situação', () => {
  const s = P.sugestao(reg('2026-11-10', [[60, 12], [60, 12], [60, 12]]), 'supino', '8–12', 3, { semanaLeve: true });
  assert.deepStrictEqual([s.tipo, s.kg], ['leve', 54]);
});
