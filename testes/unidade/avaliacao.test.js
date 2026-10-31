const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const A = require('../../treinos/avaliacao.js');

const BIB = JSON.parse(fs.readFileSync(path.join(__dirname, '../../treinos/biblioteca/exercicios.json'), 'utf8')).exercicios;
const por = new Map(BIB.map((x) => [x.id, x]));
const ex = (id, series = 3) => ({ item: por.get(id), series });
const textos = (r) => r.avisos.map((a) => a.texto).join('\n');

test('conta séries por músculo na semana: principal 1, auxiliar 0,5, vezes a frequência', () => {
  const treinos = [{ titulo: 'A', exercicios: [ex('Barbell_Bench_Press_-_Medium_Grip', 4)] }, { titulo: 'B', exercicios: [ex('Barbell_Full_Squat', 4)] }];
  const r = A.avaliar(treinos, 4); // cada treino 2x por semana
  const g = Object.fromEntries(r.grupos.map((x) => [x.id, x]));
  assert.strictEqual(g.peito.semana, 8);
  assert.strictEqual(g.triceps.semana, 4); // auxiliar
  assert.strictEqual(g.quadriceps.semana, 8);
  assert.strictEqual(g.peito.vezes, 2);
});

test('avisa grupo grande sem nada, excesso num dia, ordem invertida e repetidos', () => {
  const treinos = [{ titulo: 'PEITO', exercicios: [ex('Butterfly', 3), ex('Barbell_Bench_Press_-_Medium_Grip', 5), ex('Dumbbell_Bench_Press', 5), ex('Incline_Dumbbell_Press', 4)] }];
  const r = A.avaliar(treinos, 2);
  const t = textos(r);
  assert.match(t, /Nenhum exercício para costas/);
  assert.match(t, /séries de peito\. Acima de ~11/);
  assert.match(t, /Butterfly vem antes de/);
  assert.strictEqual(r.avisos[0].nivel, 'erro');
});

test('treino equilibrado recebe o aviso bom', () => {
  const sup = [ex('Barbell_Bench_Press_-_Medium_Grip'), ex('Incline_Dumbbell_Press'), ex('Pullups'), ex('Seated_Cable_Rows'), ex('Side_Lateral_Raise'), ex('Barbell_Curl', 2), ex('Triceps_Pushdown', 2)];
  const inf = [ex('Barbell_Full_Squat'), ex('Romanian_Deadlift'), ex('Leg_Press'), ex('Seated_Leg_Curl'), ex('Barbell_Hip_Thrust'), ex('Standing_Calf_Raises'), ex('Cable_Crunch')];
  const r = A.avaliar([{ titulo: 'SUP A', exercicios: sup }, { titulo: 'INF A', exercicios: inf }], 4);
  assert.ok(!r.avisos.some((a) => a.nivel === 'erro'), textos(r));
  const g = Object.fromEntries(r.grupos.map((x) => [x.id, x]));
  assert.ok(g.peito.semana >= 10 && g.costas.semana >= 10, JSON.stringify(g.peito));
});

test('sugere para o foco do dia os grupos com menos séries, sem repetir o que já está no dia', () => {
  const dia = { titulo: 'PULL', exercicios: [ex('Pullups', 3)] };
  const r = A.avaliar([dia], 3);
  const s = A.sugestoes(dia, ['costas', 'biceps', 'ombros'], r, BIB, new Set(['Barbell_Curl', 'Seated_Cable_Rows']));
  assert.ok(s.length >= 2);
  assert.ok(!s.some((x) => x.item.id === 'Pullups'));
  assert.ok(s.some((x) => x.grupo === 'biceps'));
  assert.strictEqual(s.find((x) => x.grupo === 'biceps').item.id, 'Barbell_Curl'); // preferido vem primeiro
});
