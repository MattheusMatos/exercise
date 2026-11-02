const { test } = require('node:test');
const assert = require('node:assert');
const F = require('../../treinos/feriados.js');
const O = require('../../treinos/ofensiva.js');

const dia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('Páscoa e feriados móveis', () => {
  assert.strictEqual(dia(F.pascoa(2026)), '2026-04-05');
  assert.strictEqual(dia(F.pascoa(2027)), '2027-03-28');
  assert.strictEqual(F.nome('2026-02-17'), 'Carnaval');
  assert.strictEqual(F.nome('2026-04-03'), 'Sexta-feira Santa');
  assert.strictEqual(F.nome('2026-06-04'), 'Corpus Christi');
});

test('feriados fixos', () => {
  assert.strictEqual(F.nome('2026-11-02'), 'Finados');
  assert.strictEqual(F.nome('2026-12-25'), 'Natal');
  assert.strictEqual(F.nome('2026-11-03'), null);
});

test('feriado protegido conta antes de gastar bloqueio', () => {
  // Meta de 2 (segunda e quarta); segunda é feriado sem treino, quarta e sexta sem treino: sem o feriado, apaga.
  const planos = { '2026-10-25': [false, true, false, true, false, true, false], '2026-11-01': [false, true, false, true, false, false, false] };
  const hist = ['2026-10-26', '2026-10-28', '2026-10-30', '2026-11-04'].map((data) => ({ data }));
  const semFeriado = O.calcular(hist, planos, '2026-11-08');
  assert.strictEqual(semFeriado.dias, 0);
  const comFeriado = O.calcular(hist, planos, '2026-11-08', ['2026-11-02']);
  assert.strictEqual(comFeriado.dias, 4);
  const { salvos } = O.aplicarBloqueios(hist, planos, '2026-11-08', [{ comprado: '2026-10-01', usado: null }], ['2026-11-02']);
  assert.strictEqual(salvos.length, 0);
});
