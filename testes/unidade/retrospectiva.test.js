const { test } = require('node:test');
const assert = require('node:assert');
const R = require('../../treinos/retrospectiva.js');

const treinos = new Map([
  ['push_a', { titulo: 'PUSH A', exercicios: [{ nome: 'Supino', primarios: ['peito'], secundarios: ['triceps'], series: 4 }] }],
  ['legs_a', { titulo: 'LEGS A', exercicios: [{ nome: 'Agachamento', primarios: ['quadriceps'], secundarios: [], series: 5 }] }],
]);
const nomes = new Map([['supino', 'Supino'], ['agacha', 'Agachamento']]);
const extra = { ofensiva: () => ({ dias: 3 }), calorias: () => 300, kcalAerobico: (a) => a.minutos * 10 };
const vazio = { historico: [], aerobicos: [], registroCargas: [], pesos: [], bloqueios: [] };

test('limites e nomes do período', () => {
  assert.deepStrictEqual(R.limites({ tipo: 'mes', ano: 2026, mes: 1 }), { inicio: '2026-02-01', fim: '2026-02-28' });
  assert.deepStrictEqual(R.limites({ tipo: 'ano', ano: 2026 }), { inicio: '2026-01-01', fim: '2026-12-31' });
  assert.strictEqual(R.nomeDoPeriodo({ tipo: 'mes', ano: 2026, mes: 9 }), 'outubro de 2026');
  assert.deepStrictEqual(R.anterior({ tipo: 'mes', ano: 2026, mes: 0 }), { tipo: 'mes', ano: 2025, mes: 11 });
});

test('conta treinos, dias, séries e músculos só do período', () => {
  const dados = {
    ...vazio,
    historico: [
      { data: '2026-09-30', treino: 'push_a', minutos: 50 },
      { data: '2026-10-05', treino: 'push_a', minutos: 50, esforco: 'pesado' },
      { data: '2026-10-07', treino: 'legs_a', minutos: 60 },
      { data: '2026-10-12', treino: 'push_a', minutos: 40 },
    ],
  };
  const r = R.resumir(dados, { tipo: 'mes', ano: 2026, mes: 9 }, treinos, nomes, extra);
  assert.deepStrictEqual([r.treinos, r.dias, r.minutos, r.kcal, r.series], [3, 3, 150, 900, 13]);
  assert.deepStrictEqual(r.favoritos[0], { titulo: 'PUSH A', vezes: 2 });
  assert.deepStrictEqual(r.topMusculos[0], { nome: 'peito', series: 8 });
  assert.deepStrictEqual(r.diaFavorito, { dia: 'segunda', vezes: 2 });
  assert.deepStrictEqual(r.esforcos, { pesado: 1 });
});

test('evolução e recordes de carga', () => {
  const dados = {
    ...vazio,
    registroCargas: [
      { data: '2026-09-29', ex: 'supino', kg: 60 },
      { data: '2026-10-06', ex: 'supino', kg: 65 },
      { data: '2026-10-27', ex: 'supino', kg: 70 },
      { data: '2026-10-08', ex: 'agacha', kg: 80 }, // primeira vez: sem troféu
    ],
  };
  const r = R.resumir(dados, { tipo: 'mes', ano: 2026, mes: 9 }, treinos, nomes, extra);
  assert.strictEqual(r.aumentos, 2);
  assert.deepStrictEqual(r.maiorEvolucao, { nome: 'Supino', de: 60, para: 70, pct: 17 });
  assert.deepStrictEqual(r.recordes.map((x) => [x.nome, x.kg, x.novo, x.antes]), [['Agachamento', 80, true, null], ['Supino', 70, true, 60]]);
  assert.strictEqual(r.recordesNovos, 1);
});

test('aeróbico e peso do corpo', () => {
  const dados = {
    ...vazio,
    aerobicos: [{ data: '2026-10-05', tipo: 'bicicleta', minutos: 20 }, { data: '2026-10-06', tipo: 'bicicleta', minutos: 10 }, { data: '2026-10-07', tipo: 'remo', minutos: 15 }],
    pesos: [{ data: '2026-09-20', kg: 82 }, { data: '2026-10-30', kg: 80.4 }],
  };
  const r = R.resumir(dados, { tipo: 'mes', ano: 2026, mes: 9 }, treinos, nomes, extra);
  assert.deepStrictEqual([r.minutosAerobico, r.kcalAerobico], [45, 450]);
  assert.deepStrictEqual(r.aerobicoFavorito, { tipo: 'bicicleta', minutos: 30 });
  assert.deepStrictEqual(r.peso, { de: 82, para: 80.4, diferenca: -1.6 });
});
