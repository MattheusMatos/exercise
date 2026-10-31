/*
 * Aeróbico no fim do treino, esportes em qualquer hora do dia e os pontos do app.
 *
 * Gasto calórico: MET × peso (kg) × horas, com os METs do Compendium of Physical
 * Activities (Ainsworth et al., 2011). É uma média: varia com a velocidade, a carga e a pessoa.
 * Impacto: força no chão a cada passo, em vezes o peso do corpo (caminhada ~1–1,5×,
 * corrida ~2–3×); bicicleta, elíptico e remo não têm a fase de voo.
 *
 * Pontos: 10 por dia de treino e, no mesmo dia, 1 a cada 2 minutos de aeróbico (somando até 30 min).
 * No navegador fica em window.Aerobico; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  const MODALIDADES = [
    {
      id: 'caminhada', nome: 'Caminhada na esteira', imagem: 'Walking_Treadmill', met: 4.3, ritmo: '5,6 km/h, sem inclinação',
      impacto: 'baixo', articulacoes: 'Um pé sempre no chão: cada passo leva 1 a 1,5 vez o peso do corpo. Boa para quem sente o joelho. Com inclinação, gasta mais sem aumentar o impacto.',
    },
    {
      id: 'corrida', nome: 'Corrida na esteira', imagem: 'Running_Treadmill', met: 8.3, ritmo: '8 km/h',
      impacto: 'alto', articulacoes: 'Cada passada leva 2 a 3 vezes o peso do corpo em tornozelo, joelho e quadril. Evite com dor nessas articulações e em dia de perna: corrida pode atrapalhar um pouco o crescimento das fibras do tipo I, e a bicicleta não (Lundberg et al., 2022).',
    },
    {
      id: 'bicicleta', nome: 'Bicicleta ergométrica', imagem: 'Bicycling_Stationary', met: 6.8, ritmo: 'moderado, 90–100 W',
      impacto: 'nenhum', articulacoes: 'Sem impacto: o peso fica no banco. Banco na altura do quadril, para o joelho não dobrar demais. Nos estudos, bicicleta junto com musculação não atrapalhou o crescimento das fibras (Lundberg et al., 2022).',
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
    // Esportes (grupo 'esporte'): sem foto, com um ícone. METs do Compendium (Ainsworth et al., 2011).
    {
      id: 'basquete', grupo: 'esporte', nome: 'Basquete', icone: '🏀', met: 8.0, ritmo: 'jogo',
      impacto: 'alto', articulacoes: 'Saltos e mudanças de direção: tornozelo e joelho levam bastante carga. Tênis de quadra com amortecimento e aquecimento antes ajudam a evitar entorse.',
    },
    {
      id: 'futebol', grupo: 'esporte', nome: 'Futebol', icone: '⚽', met: 7.0, ritmo: 'pelada, sem competição',
      impacto: 'alto', articulacoes: 'Corrida com arrancadas e giros: joelho e tornozelo trabalham muito. Depois de um treino pesado de perna, pegue mais leve.',
    },
    {
      id: 'volei', grupo: 'esporte', nome: 'Vôlei', icone: '🏐', met: 3.0, ritmo: 'recreativo, em quadra',
      impacto: 'alto', articulacoes: 'Pouca corrida, mas saltos e bloqueios: joelho e ombro trabalham. O gasto é baixo no recreativo; no competitivo chega ao dobro.',
    },
    {
      id: 'volei_praia', grupo: 'esporte', nome: 'Vôlei de praia', icone: '🏖️', met: 8.0, ritmo: 'na areia',
      impacto: 'baixo', articulacoes: 'A areia amortece os saltos, mas cansa muito mais as pernas.',
    },
    {
      id: 'tenis', grupo: 'esporte', nome: 'Tênis', icone: '🎾', met: 7.3, ritmo: 'jogo',
      impacto: 'alto', articulacoes: 'Arrancadas curtas e o mesmo braço sempre: ombro e cotovelo do lado da raquete pedem atenção.',
    },
    {
      id: 'natacao', grupo: 'esporte', nome: 'Natação', icone: '🏊', met: 5.8, ritmo: 'crawl, leve a moderado',
      impacto: 'nenhum', articulacoes: 'Sem impacto: a água segura o peso. Boa para quem sente o joelho; o ombro trabalha bastante.',
    },
    {
      id: 'ciclismo', grupo: 'esporte', nome: 'Pedal na rua', icone: '🚴', met: 7.5, ritmo: 'ritmo geral',
      impacto: 'nenhum', articulacoes: 'Sem impacto: o peso fica no banco. Ajuste o banco na altura do quadril.',
    },
  ];
  const grupoDe = (m) => m.grupo || 'aparelho';
  const IMPACTOS = { nenhum: 'Sem impacto', baixo: 'Impacto baixo', alto: 'Impacto alto' };
  const MINUTOS = [15, 20, 30]; // atalhos do cronômetro; dá para escolher qualquer tempo
  const MINUTOS_MAX = 180;
  const META_SEMANA = 150; // minutos de atividade moderada por semana (OMS, 2020)
  const PONTOS_TREINO = 10;

  const porId = new Map(MODALIDADES.map((m) => [m.id, m]));
  const modalidade = (id) => porId.get(id) || null;
  const calorias = (id, minutos, peso) => Math.round(((modalidade(id) || { met: 0 }).met * peso * minutos) / 60 / 5) * 5;
  const pontosDoAerobico = (minutos) => Math.floor(Math.min(30, minutos) / 2);

  const minutosDoDia = (aerobicos, data) => aerobicos.filter((a) => a.data === data).reduce((soma, a) => soma + a.minutos, 0);

  // historico: [{ data }] dos treinos; aerobicos: [{ data, tipo, minutos }], pode haver vários no dia.
  // O aeróbico só pontua no dia em que houve treino, somando até 30 min por dia.
  function pontos(historico, aerobicos) {
    const dias = new Set(historico.map((x) => x.data));
    let extra = 0;
    for (const data of dias) extra += pontosDoAerobico(minutosDoDia(aerobicos, data));
    return dias.size * PONTOS_TREINO + extra;
  }

  const api = { MODALIDADES, grupoDe, IMPACTOS, MINUTOS, MINUTOS_MAX, META_SEMANA, PONTOS_TREINO, modalidade, calorias, pontosDoAerobico, minutosDoDia, pontos };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Aerobico = api;
})(typeof window !== 'undefined' ? window : globalThis);
