/*
 * Semelhança entre dois exercícios, para sugerir trocas no app.
 *
 *   músculos     50%  quanto o substituto cobre os músculos principais do original e
 *                     quanto os músculos coincidem no todo (principal vale 1, auxiliar 0,5)
 *   movimento    30%  mesmo padrão vale 1; padrões parecidos valem uma fração (RELACOES)
 *   tipo         10%  multiarticular ou isolado
 *   equipamento  10%  mesmo equipamento
 *
 * Um exercício diferente do original nunca passa de 98%.
 * No navegador fica em window.Semelhanca; no Node, em module.exports.
 */
(function (raiz) {
  'use strict';

  const PESOS = { musculos: 0.5, movimento: 0.3, tipo: 0.1, equipamento: 0.1 };

  // Padrões diferentes que ainda substituem um ao outro em parte (vale nos dois sentidos).
  const RELACOES = {
    'agachamento|avanco': 0.8,
    'agachamento|extensao-joelho': 0.3,
    'agachamento|quadril': 0.3,
    'avanco|quadril': 0.25,
    'quadril|ponte': 0.6,
    'quadril|flexora': 0.35,
    'quadril|flexora-sentada': 0.35,
    'flexora|flexora-sentada': 0.7, // sentada rendeu mais (Maeo et al., 2021)
    'ponte|chute-gluteo': 0.6,
    'supino|mergulho': 0.7,
    'supino|crucifixo': 0.4,
    'supino|desenvolvimento': 0.35,
    'mergulho|triceps-polia': 0.35,
    'mergulho|triceps-acima': 0.3,
    'triceps-acima|triceps-polia': 0.5, // acima da cabeça cresceu ~40% mais (Maeo et al., 2023)
    'desenvolvimento|elevacao-lateral': 0.3,
    'desenvolvimento|elevacao-frontal': 0.4,
    'elevacao-lateral|remada-alta': 0.5,
    'elevacao-lateral|elevacao-frontal': 0.3,
    'elevacao-lateral|posterior-ombro': 0.2,
    'posterior-ombro|remada': 0.4,
    'remada|puxada-vertical': 0.5,
    'puxada-vertical|pullover': 0.5,
    'remada|pullover': 0.3,
    'encolhimento|remada-alta': 0.4,
    'rosca|rosca-martelo': 0.7,
    'rosca|rosca-inversa': 0.6,
    'rosca-martelo|rosca-inversa': 0.7,
    'rosca|punho': 0.2,
    'panturrilha|panturrilha-sentada': 0.6,
    'abdomen-flexao|abdomen-infra': 0.75,
    'abdomen-infra|abdomen-estabilidade': 0.5,
    'abdomen-infra|abdomen-rotacao': 0.4,
    'abdomen-flexao|abdomen-rotacao': 0.5,
    'abdomen-flexao|abdomen-estabilidade': 0.5,
    'abdomen-rotacao|abdomen-estabilidade': 0.5,
    'aducao|abducao': 0.3,
  };

  const MOVIMENTOS = {
    agachamento: 'agachamento',
    avanco: 'afundo',
    'extensao-joelho': 'extensão de joelho',
    'flexora-sentada': 'flexão de joelho sentado',
    flexora: 'flexão de joelho',
    quadril: 'terra e stiff',
    ponte: 'elevação de quadril',
    'chute-gluteo': 'coice para glúteo',
    aducao: 'adução de quadril',
    abducao: 'abdução de quadril',
    panturrilha: 'panturrilha com joelho estendido',
    'panturrilha-sentada': 'panturrilha sentado',
    supino: 'empurrar à frente',
    mergulho: 'paralelas',
    crucifixo: 'crucifixo',
    desenvolvimento: 'empurrar acima da cabeça',
    'elevacao-lateral': 'elevação lateral',
    'elevacao-frontal': 'elevação frontal',
    'posterior-ombro': 'abrir os braços para trás',
    'rotacao-ombro': 'rotação de ombro',
    'remada-alta': 'remada alta',
    encolhimento: 'encolhimento',
    'puxada-vertical': 'puxar de cima',
    remada: 'remada',
    pullover: 'pullover',
    rosca: 'rosca',
    'rosca-martelo': 'rosca martelo',
    'rosca-inversa': 'rosca inversa',
    punho: 'punho',
    'triceps-acima': 'tríceps acima da cabeça',
    'triceps-polia': 'tríceps com braço ao lado do corpo',
    'abdomen-flexao': 'flexão do tronco',
    'abdomen-infra': 'elevação de pernas',
    'abdomen-rotacao': 'rotação do tronco',
    'abdomen-estabilidade': 'estabilização do tronco',
    potencia: 'movimento explosivo',
    pescoco: 'pescoço',
  };

  function relacao(a, b) {
    if (a === b) return 1;
    return RELACOES[`${a}|${b}`] || RELACOES[`${b}|${a}`] || 0;
  }

  function pesosMusculos(e) {
    const pesos = new Map();
    for (const m of e.auxiliares) pesos.set(m, 0.5);
    for (const m of e.musculos) pesos.set(m, 1);
    return pesos;
  }

  function musculos(original, outro) {
    const a = pesosMusculos(original);
    const b = pesosMusculos(outro);
    let comum = 0;
    let total = 0;
    for (const m of new Set([...a.keys(), ...b.keys()])) {
      comum += Math.min(a.get(m) || 0, b.get(m) || 0);
      total += Math.max(a.get(m) || 0, b.get(m) || 0);
    }
    const coincidencia = total ? comum / total : 1;
    const cobertura = original.musculos.length
      ? original.musculos.reduce((soma, m) => soma + (b.get(m) || 0), 0) / original.musculos.length
      : coincidencia;
    return 0.6 * cobertura + 0.4 * coincidencia;
  }

  function tipo(a, b) {
    if (!a || !b) return 0.5;
    return a === b ? 1 : 0;
  }

  function equipamento(a, b) {
    if (a === b) return 1;
    return [a, b].sort().join('|') === 'barra|barra-w' ? 0.8 : 0;
  }

  /** Compara um exercício com o original; devolve a porcentagem e cada parte (0 a 1). */
  function comparar(original, outro) {
    const partes = {
      musculos: musculos(original, outro),
      movimento: relacao(original.padrao, outro.padrao),
      tipo: tipo(original.mecanica, outro.mecanica),
      equipamento: equipamento(original.equipamento, outro.equipamento),
    };
    let total = 0;
    for (const chave of Object.keys(PESOS)) total += PESOS[chave] * partes[chave];
    if (original.id !== outro.id) total = Math.min(total, 0.98);
    return { porcentagem: Math.round(total * 100), ...partes };
  }

  const rotuloMovimento = (padrao) => MOVIMENTOS[padrao] || 'outro movimento';

  const api = { comparar, relacao, rotuloMovimento, PESOS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Semelhanca = api;
})(typeof window !== 'undefined' ? window : globalThis);
