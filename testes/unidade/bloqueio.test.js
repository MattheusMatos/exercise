const { test } = require('node:test');
const assert = require('node:assert');
const O = require('../../treinos/ofensiva.js');

const h = (...datas) => datas.map((data) => ({ data, treino: 'x' }));
const SEG_QUA_SEX = [false, true, false, true, false, true, false];
const planos = { '2026-10-25': SEG_QUA_SEX, '2026-11-01': SEG_QUA_SEX };
// Semana de 25/10: seg, qua e sex treinados (3 dias). Semana de 01/11: só segunda, depois viagem.
const hist = h('2026-10-26', '2026-10-28', '2026-10-30', '2026-11-02');

test('sem bloqueio, apaga na sexta (fez 1 de 3, sobra só o sábado)', () => {
  const r = O.calcular(hist, planos, '2026-11-07');
  assert.deepStrictEqual([r.dias, r.quebras], [0, [{ data: '2026-11-06', dias: 4 }]]);
});
test('com 2 bloqueios, salva a semana', () => {
  const { bloqueios, salvos } = O.aplicarBloqueios(hist, planos, '2026-11-07', [{ comprado: '2026-11-01', usado: null }, { comprado: '2026-11-01', usado: null }]);
  assert.strictEqual(salvos.length, 1);
  assert.strictEqual(salvos[0].dias, 4);
  const r = O.calcular(hist, planos, '2026-11-07', bloqueios.filter((b) => b.usado).map((b) => b.usado));
  assert.deepStrictEqual([r.dias, r.quebras.length], [4, 0]);
});
test('faltaram 2 (sexta e sábado) com 1 bloqueio: não gasta', () => {
  const { bloqueios, salvos } = O.aplicarBloqueios(hist, planos, '2026-11-08', [{ comprado: '2026-11-01', usado: null }]);
  assert.deepStrictEqual([salvos.length, bloqueios[0].usado], [0, null]);
});
test('semana inteira fora (meta 3) com 2 bloqueios: não gasta nenhum', () => {
  const h3 = h('2026-10-26', '2026-10-28', '2026-10-30');
  const { bloqueios, salvos } = O.aplicarBloqueios(h3, planos, '2026-11-09', [{ comprado: '2026-11-01', usado: null }, { comprado: '2026-11-01', usado: null }]);
  assert.deepStrictEqual([salvos.length, bloqueios.filter((b) => b.usado).length], [0, 0]);
});
test('semana inteira fora (meta 2) com 2 bloqueios: salva', () => {
  const p2 = { '2026-10-25': SEG_QUA_SEX, '2026-11-01': [false, true, false, false, true, false, false] };
  const h3 = h('2026-10-26', '2026-10-28', '2026-10-30');
  const { bloqueios, salvos } = O.aplicarBloqueios(h3, p2, '2026-11-09', [{ comprado: '2026-11-01', usado: null }, { comprado: '2026-11-01', usado: null }]);
  assert.strictEqual(salvos.length, 1);
  const r = O.calcular(h3, p2, '2026-11-09', bloqueios.filter((b) => b.usado).map((b) => b.usado));
  assert.strictEqual(r.dias, 3);
});
test('faltou 1 dia: 1 bloqueio salva', () => {
  const hist2 = h('2026-10-26', '2026-10-28', '2026-10-30', '2026-11-02', '2026-11-04');
  const { bloqueios, salvos } = O.aplicarBloqueios(hist2, planos, '2026-11-08', [{ comprado: '2026-11-03', usado: null }, { comprado: '2026-11-03', usado: null }]);
  assert.strictEqual(salvos.length, 1);
  assert.strictEqual(bloqueios.filter((b) => b.usado).length, 1);
  const r = O.calcular(hist2, planos, '2026-11-08', bloqueios.filter((b) => b.usado).map((b) => b.usado));
  assert.strictEqual(r.dias, 5);
});
test('bloqueio comprado depois da quebra não salva', () => {
  const { salvos } = O.aplicarBloqueios(hist, planos, '2026-11-07', [{ comprado: '2026-11-07', usado: null }, { comprado: '2026-11-07', usado: null }]);
  assert.strictEqual(salvos.length, 0);
});
test('dia protegido não soma ofensiva', () => {
  const r = O.calcular(h('2026-10-26'), { '2026-10-25': [false, true, true, false, false, false, false] }, '2026-10-28', ['2026-10-27']);
  assert.deepStrictEqual([r.dias, r.quebras.length], [1, 0]);
});
test('risco considera o dia protegido', () => {
  const r = O.calcular(h('2026-10-26'), { '2026-10-25': SEG_QUA_SEX }, '2026-10-31', ['2026-10-28']);
  assert.strictEqual(r.risco, true); // fez 1 e tem 1 bloqueio: precisa treinar no sábado
  const r2 = O.calcular(h('2026-10-26'), { '2026-10-25': SEG_QUA_SEX }, '2026-10-31', ['2026-10-28', '2026-10-29']);
  assert.strictEqual(r2.risco, false);
});
