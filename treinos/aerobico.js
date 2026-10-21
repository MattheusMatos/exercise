/*
 * Aeróbico para fazer no fim do treino e os pontos do app.
 *
 * Gasto calórico: MET × peso (kg) × horas, com os METs do Compendium of Physical
 * Activities (Ainsworth et al., 2011). É uma média: varia com a velocidade, a carga e a pessoa.
 * Impacto: força no chão a cada passo, em vezes o peso do corpo (caminhada ~1–1,5×,
 * corrida ~2–3×); bicicleta, elíptico e remo não têm a fase de voo.
 *
 * Pontos: 10 por dia de treino e, no mesmo dia, 1 a cada 2 minutos de aeróbico (até 30 min).
 * No navegador fica em window.Aerobico; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  const MODALIDADES = [
    {
      id: 'caminhada', nome: 'Caminhada na esteira', imagem: 'Walking_Treadmill', met: 4.3, ritmo: '5,5 km/h, sem inclinação',
      impacto: 'baixo', articulacoes: 'Um pé sempre no chão: cada passo leva 1 a 1,5 vez o peso do corpo. Boa para quem sente o joelho. Com inclinação, gasta mais sem aumentar o impacto.',
    },
    {
      id: 'corrida', nome: 'Corrida na esteira', imagem: 'Running_Treadmill', met: 8.3, ritmo: '8 km/h',
      impacto: 'alto', articulacoes: 'Cada passada leva 2 a 3 vezes o peso do corpo em tornozelo, joelho e quadril. Evite com dor nessas articulações e em dia de perna: corrida atrapalha mais o ganho de músculo que bicicleta (Wilson et al., 2012).',
    },
    {
      id: 'bicicleta', nome: 'Bicicleta ergométrica', imagem: 'Bicycling_Stationary', met: 6.8, ritmo: 'moderado, 90–100 W',
      impacto: 'nenhum', articulacoes: 'Sem impacto: o peso fica no banco. Banco na altura do quadril, para o joelho não dobrar demais. É o aeróbico que menos atrapalha a musculação (Wilson et al., 2012).',
    },
    {
      id: 'eliptico', nome: 'Elíptico', imagem: 'Elliptical_Trainer', met: 5.0, ritmo: 'moderado',
      impacto: 'baixo', articulacoes: 'Os pés não saem do pedal, então o impacto é menor que o da caminhada. Mexe braços e pernas juntos.',
    },
    {
      id: 'escada', nome: 'Escada (simulador)', imagem: 'Stairmaster', met: 9.0, ritmo: 'ritmo constante',
      impacto: 'baixo', articulacoes: 'Pouco impacto, mas o joelho trabalha dobrado e com o peso todo: pega bastante glúteo e coxa. Com dor no joelho, prefira a bicicleta. Não se apoie no corrimão.',
    },
    {
      id: 'remo', nome: 'Remo ergométrico', imagem: 'Rowing_Stationary', met: 7.0, ritmo: 'moderado',
      impacto: 'nenhum', articulacoes: 'Sem impacto, trabalha pernas, costas e braços. Empurre com as pernas e mantenha a coluna reta, sem arredondar a lombar.',
    },
  ];
  const IMPACTOS = { nenhum: 'Sem impacto', baixo: 'Impacto baixo', alto: 'Impacto alto' };
  const MINUTOS = [10, 20, 30];
  const PONTOS_TREINO = 10;

  const porId = new Map(MODALIDADES.map((m) => [m.id, m]));
  const modalidade = (id) => porId.get(id) || null;
  const calorias = (id, minutos, peso) => Math.round(((modalidade(id) || { met: 0 }).met * peso * minutos) / 60 / 5) * 5;
  const pontosDoAerobico = (minutos) => Math.floor(Math.min(30, minutos) / 2);

  // historico: [{ data }] dos treinos; aerobicos: [{ data, tipo, minutos }], um por dia.
  // O aeróbico só pontua no dia em que houve treino.
  function pontos(historico, aerobicos) {
    const dias = new Set(historico.map((x) => x.data));
    const extra = aerobicos.filter((a) => dias.has(a.data)).reduce((soma, a) => soma + pontosDoAerobico(a.minutos), 0);
    return dias.size * PONTOS_TREINO + extra;
  }

  const api = { MODALIDADES, IMPACTOS, MINUTOS, PONTOS_TREINO, modalidade, calorias, pontosDoAerobico, pontos };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Aerobico = api;
})(typeof window !== 'undefined' ? window : globalThis);
