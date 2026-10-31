const { test } = require('node:test');
const assert = require('node:assert');
const A = require('../../treinos/aerobico.js');

test('calorias pelo MET, arredondadas de 5 em 5', () => {
  // bicicleta 6,8 MET × 80 kg × 0,5 h = 272 → 270
  assert.strictEqual(A.calorias('bicicleta', 30, 80), 270);
  assert.strictEqual(A.calorias('nao-existe', 30, 80), 0);
});

test('1 ponto a cada 2 minutos, até 30 minutos', () => {
  assert.deepStrictEqual([0, 1, 2, 15, 30, 45, 180].map(A.pontosDoAerobico), [0, 0, 1, 7, 15, 15, 15]);
});

test('aeróbico só pontua em dia de treino e soma até 30 min no dia', () => {
  const historico = [{ data: '2026-10-26' }, { data: '2026-10-26' }, { data: '2026-10-28' }];
  const aerobicos = [
    { data: '2026-10-26', tipo: 'bicicleta', minutos: 20 },
    { data: '2026-10-26', tipo: 'remo', minutos: 20 }, // passa de 30: conta 30
    { data: '2026-10-27', tipo: 'corrida', minutos: 30 }, // sem treino: não conta
  ];
  assert.strictEqual(A.pontos(historico, aerobicos), 2 * A.PONTOS_TREINO + 15);
});

test('esportes têm ícone; aparelhos têm foto', () => {
  for (const m of A.MODALIDADES) {
    if (A.grupoDe(m) === 'esporte') assert.ok(m.icone && !m.imagem, m.id);
    else assert.ok(m.imagem, m.id);
    assert.ok(A.IMPACTOS[m.impacto], m.id);
  }
  assert.strictEqual(A.calorias('basquete', 60, 80), 640);
});
